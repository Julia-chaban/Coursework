import {
  getPosts,
  getUserPosts,
  addPost,
  likePost,
  dislikePost,
} from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];
let currentPageData = {};

const getToken = () => {
  return user ? `Bearer ${user.token}` : undefined;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

export const goToPage = (newPage, data) => {
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      currentPageData = data || {};
      return renderApp();
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      currentPageData = data || {};
      renderApp();

      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }

    if (newPage === USER_POSTS_PAGE) {
      console.log("Открываю страницу пользователя: ", data.userId);
      page = LOADING_PAGE;
      currentPageData = data || {};
      renderApp();

      return getUserPosts({ token: getToken(), userId: data.userId })
        .then((newPosts) => {
          page = USER_POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }

    page = newPage;
    currentPageData = data || {};
    renderApp();
    return;
  }

  throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");

  if (!appEl) {
    console.error("Элемент app не найден!");
    return;
  }

  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
      },
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
      onAddPostClick({ description, imageUrl }) {
        console.log("Добавляю пост с данными:", {
          description: description.substring(0, 50) + "...",
          imageUrl: imageUrl.substring(0, 100) + "...",
        });

        if (!user || !user.token) {
          alert("Ошибка авторизации. Пожалуйста, войдите снова.");
          goToPage(AUTH_PAGE);
          return;
        }

        page = LOADING_PAGE;
        renderApp();

        addPost({
          token: `Bearer ${user.token}`,
          description: description.trim(),
          imageUrl: imageUrl,
        })
          .then((newPost) => {
            console.log("Пост успешно добавлен:", newPost);
            // Вместо повторного запроса всех постов, добавляем новый пост в начало списка
            if (newPost && newPost.post) {
              posts.unshift(newPost.post);
            } else {
              // Если API не возвращает новый пост, загружаем свежий список
              return getPosts({ token: getToken() });
            }
          })
          .then((newPosts) => {
            if (newPosts) {
              posts = newPosts;
            }
            goToPage(POSTS_PAGE);
          })
          .catch((error) => {
            console.error("Ошибка добавления поста:", error);
            alert("Ошибка при добавлении поста: " + error.message);
            goToPage(ADD_POSTS_PAGE); // Возвращаем на страницу добавления
          });
      },
    });
  }

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
      userId: currentPageData.userId,
    });
  }

  if (page === USER_POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
      userId: currentPageData.userId,
    });
  }
};

goToPage(POSTS_PAGE);
