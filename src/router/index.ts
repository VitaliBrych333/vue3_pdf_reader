import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded, NavigationGuardNext } from 'vue-router';

import { storeDocument } from '../store/storeDocument';

import { useRequestInit } from '../composables/useRequestInit';
import type { Document } from '../shared/document.interface';

import { storeUser } from '../store/storeUser';


// export const documentsResolver = async (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext) => {
//   // to.meta['documents'] = await

//   console.log('99999999999999', to, from, next)

//   const options = useRequestInit('GET');
//   const response = await fetch(`http://localhost:8081/documents?userId=${storeUser.userId}`, options);
//   const documents = await response.json();

//   // this.getDocuments().then((documents: Document[]) => {

//     documents.forEach((doc: Document) => {
//       const binaryFile = atob(doc.file);
//       const array = new Uint8Array(binaryFile.length);

//       for(let i = 0; i < binaryFile.length; i++ ) {
//         array[i] = binaryFile.charCodeAt(i)
//       }

//       const url = URL.createObjectURL(new Blob([array], { type: "application/json" }));

//       storeDocument.setUsePdf(doc.name, url);
//     });

//     // this.isDocumentsLoaded = true;
//   // });

//   next();
// }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'home',
    //   component: HomeView,
    // },
    {
      path: '/',
      name: 'home',
      redirect: { name: 'login' }
      // component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/docReader',
      name: 'docReader',
      component: () => import('../views/DocReader.vue'),
      // beforeEnter: documentsResolver
    },
    {
      path: '/wrappedDocReader',
      name: 'wrappedDocReader',
      component: () => import('../views/WrappedDocReader.vue')
    },
    {
      path: '/compareDocReader',
      name: 'compareDocReader',
      component: () => import('../views/CompareDocReader.vue')
    },
    {
      path: '/editDocReader',
      name: 'editDocReader',
      component: () => import('../views/EditDocReader.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
