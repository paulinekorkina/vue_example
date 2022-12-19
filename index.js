import ApiService from '@/services/api.service';
import getters from '@/store/global';

const state = {
    blacklist: [],
    count: '',
    next: '',
    errors: {}
};

getters['fetchBlacklist'] = function(state) { return state.blacklist }
getters['fetchBlacklistCount'] = function(state) { return state.count }
getters['fetchBlacklistNext'] = function(state) { return state.next }

const actions = {
    get(context, payload=false) {
        let url =
            payload ?
            'blacklist/?q=' + payload :
            'blacklist/';
        return ApiService
            .get(url)
            .then((response) => {
                context.commit('SET_ERROR', {});
                context.commit('SET_BLACKLIST', response.data.results);
                context.commit('SET_COUNT', response.data.count);
                context.commit('SET_NEXT', response.data);
            })
            .catch(() => {
                throw new Error('Something goes wrong');
            })
    },
    getNext(context) {
        return ApiService
            .get(context.state.next)
            .then((response) => {
                context.commit('SET_ERROR', {});
                context.commit('ADD_BLACKLIST', response.data.results);
                context.commit('SET_COUNT', response.data.count);
                context.commit('SET_NEXT', response.data);
            })
            .catch((response) => {
                context.commit('SET_ERROR', response.data);
                throw new Error('Something goes wrong');
            })
    },
    remove(context, payload) {
        return ApiService
            .delete('blacklist/' + payload + '/remove/')
            .then((response) => {
                context.commit('REMOVE_USER', payload);
                context.commit('SET_ERROR', {});
            })
            .catch(() => {
                throw new Error('Something goes wrong');
            })
    }
};

const mutations = {
    SET_BLACKLIST(state, blacklist) {
        state.blacklist = blacklist;
        state.errors = {};
    },
    ADD_BLACKLIST(state, blacklist) {
        state.blacklist = state.blacklist.concat(blacklist);
        state.errors = {};
    },
    REMOVE_USER(state, user) {
        for (let i in state.blacklist) {
            if (state.blacklist[i].id == user) {
                state.blacklist.splice(i, 1);
            }
        }
        state.count = --state.count;
    },
    SET_COUNT(state, count) {
        state.count = count;
        state.errors = {};
    },
    SET_NEXT(state, data) {
        let symbol = data.url.indexOf('?') == -1 ? '?' : '&';
        if (data.page < data.num_pages) {
            state.next =
            data.url +
            symbol +
            data.page_param +
            '=' +
            (data.page + 1);
        } else {
            state.next = '';
        }
        state.errors = {};
    },
    SET_ERROR(state, errors) {
        state.errors = errors;
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
