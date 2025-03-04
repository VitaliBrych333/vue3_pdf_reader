import { reactive } from 'vue';

export const storeUser = reactive({
  userId: '107',
  userToken: '',

  setUserId(id: string) {
    this.userId = id;
  },

  setUserToken(token: string) {
    this.userToken = token;
  },
});
