import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({

    history: createWebHistory(),

    routes: [

        // Home
        {
            path: "/",
            name: "home",
            component: () => import("../views/HomeView.vue")
        },

        // Catalogue
        {
            path: "/catalogue",
            name: "catalogue",
            component: () => import("../views/CatalogueView.vue")
        },

        // Member / Stokvel
        {
            path: "/member/:id",
            name: "MemberDashboard",
            component: () => import("../views/MemberDashboard.vue")
        },

        // /member goes to member 1 for now
        {
            path: "/member",
            redirect: "/member/1"
        },

        // Admin
        {
            path: "/admin",
            name: "AdminDashboard",
            component: () => import("../views/AdminDashboard.vue")
        }

    ]

});

export default router;