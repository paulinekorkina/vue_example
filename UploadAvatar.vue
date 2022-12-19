<template>
    <modal
        name="upload-avatar"
        @before-open="beforeOpen"
        @before-close="beforeClose"
        :classes="['v--modal', 'modal', 'error-modal', 'upload-avatar', hasBugs && 'has-bugs']"
        :width="730"
        :height="'auto'"
        :scrollable="true"
        :adaptive="true"
    >
        <div class="modal-title">Загрузка фотографии</div>
        <div class="modal-close" @click="close"></div>
        <div
            v-if="!avatar || errors.has('avatar')"
            class="modal-body"
        >
            <div class="modal-subtitle">Вы можете загрузить изображение в формате JPG, GIF или PNG</div>
            <div class="upload-avatar-input">
                <label class="button-secondary">
                    <input
                        type="file"
                        accept="image/*"
                        id="avatar"
                        name="avatar"
                        @change="addImage($event, 'avatar')"
                        v-validate="{
                            size:10000,
                            ext:['jpeg','jpg','png','gif'],
                            mindimensions: [220,310]
                        }"
                        data-vv-as="file"
                        class="input-hidden"
                    >
                    Выбрать файл
                </label>
                <div class="v-error">{{ errors.first('avatar') }}</div>
            </div>
        </div>
        <div
            v-else
            class="modal-body"
        >
            <div class="modal-subtitle">Выбранная область будет показываться в вашей анкете</div>
            <div class="upload-avatar-wrapper">
                <vue-cropper
                    :viewMode=1
                    ref="cropper"
                    :src="avatar"
                    alt="Source Image"
                    :aspectRatio="220/310"
                    :guides=false
                    :center=false
                    :zoomOnWheel=false
                    :minCropBoxWidth=220
                    :minCropBoxHeight=310
                    :background=false
                    class="upload-avatar-cropper"
                >
                </vue-cropper>
            </div>
            <div class="buttons-row">
                <button
                    @click="close"
                    class="button-secondary"
                >Отмена</button>
                <button
                    @click="save"
                    v-if="!loader"
                    class="button"
                >Сохранить</button>
                <button
                    v-else
                    class="button button-loader"
                ></button>
            </div>
        </div>
    </modal>
</template>

<script>
    import {mapGetters} from 'vuex';
    import {uploadImage} from '@/mixins/uploadImage';
    import {localizeValidation} from '@/mixins/localizeValidation';
    import {checkScroll} from '@/mixins/checkScroll';
    import VueCropper from 'vue-cropperjs';
    import 'cropperjs/dist/cropper.css';

    export default {
        name: 'UploadAvatar',
        components: {
            VueCropper
        },
        mixins: [
            uploadImage,
            localizeValidation,
            checkScroll
        ],
        data() {
            return {
                hasBugs: false,
                loader: false,
                avatar: ''
            }
        },
        computed: {
            ...mapGetters({
                userErrors: 'user/fetchUserErrors'
            }),
        },
        methods: {
            beforeOpen() {
                this.checkScroll();
                this.localizeValidation();

                const minDimensionsRule = {
                    getMessage(field, [width, height], data) {
                        return (data && data.message) || `Изображение должно быть не менее чем ${width}*${height} пикселей`;
                    },
                    validate(files, [width, height]) {
                        const validateImage = (file, width, height) => {
                        const URL = window.URL || window.webkitURL;
                            return new Promise(resolve => {
                                const image = new Image();
                                image.onerror = () => resolve({ valid: false });
                                image.onload = () => resolve({
                                    valid: image.width >= Number(width) && image.height >= Number(height)
                                });

                                image.src = URL.createObjectURL(file);
                            });
                        };
                        const list = [];
                        for (let i = 0; i < files.length; i++) {
                            if (! /\.(jpg|svg|jpeg|png|bmp|gif)$/i.test(files[i].name)) {
                                return false;
                            }
                            list.push(files[i]);
                        }
                        return Promise.all(list.map(file => validateImage(file, width, height)));
                    }
                };

                this.$validator.extend('mindimensions', minDimensionsRule);
            },
            beforeClose() {
                this.checkRemoveScroll();
                this.errors.clear();
                this.$validator.reset();
                this.avatar = '';
            },
            save() {
                let cropped = this.$refs.cropper.getCroppedCanvas().toDataURL();
                this.loader = true;
                this.$store.dispatch('user/setAvatar', {avatar: cropped})
                .then(() => {
                    this.$modal.hide('upload-avatar');
                    this.loader = false;
                })
                .catch(() => {
                    if (typeof this.userErrors === 'object') {
                        for (let key in this.userErrors) {
                            this.errors.add({
                                field: key,
                                msg: this.userErrors[key][0]
                            });                       
                        }
                    }
                    this.loader = false;
                });
            },
            close() {                
                this.$modal.hide('upload-avatar');
            }
        }
    }
</script>

<style lang="scss">
    @import '~@/assets/styles/components/_cropper';
    @import '~@/assets/styles/layout/_upload-avatar';
</style>