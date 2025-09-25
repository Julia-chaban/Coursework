import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { likePost, dislikePost } from "../api.js";

export function renderPostsPageComponent({ appEl, userId }) {
  console.log("Актуальный список постов:", posts);

  // Фильтруем посты если передан userId
  const displayedPosts = userId
    ? posts.filter((post) => post.user.id === userId)
    : posts;

  // Получаем данные пользователя для заголовка (если это страница пользователя)
  const userData =
    userId && displayedPosts.length > 0 ? displayedPosts[0].user : null;

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      ${
        userData
          ? `
        <div class="posts-user-header">
          <img src="${userData.imageUrl}" class="posts-user-header__user-image">
          <p class="posts-user-header__user-name">${userData.name}</p>
        </div>
      `
          : ""
      }
      <ul class="posts">
        ${displayedPosts
          .map((post) => {
            const isLiked = user
              ? post.likes.some((like) => like.id === user.id)
              : false;
            const timeAgo = formatTimeAgo(new Date(post.createdAt));

            return `
          <li class="post" data-post-id="${post.id}">
            <div class="post-header" data-user-id="${post.user.id}">
              <img src="${post.user.imageUrl}" class="post-header__user-image">
              <p class="post-header__user-name">${post.user.name}</p>
            </div>
            <div class="post-image-container">
              <img class="post-image" src="${post.imageUrl}">
            </div>
            <div class="post-likes">
              <button data-post-id="${post.id}" class="like-button">
                <img src="./assets/images/like-${
                  isLiked ? "active" : "not-active"
                }.svg">
              </button>
              <p class="post-likes-text">
                Нравится: <strong>${post.likes.length}</strong>
              </p>
            </div>
            <p class="post-text">
              <span class="user-name">${post.user.name}</span>
              ${escapeHtml(post.description)}
            </p>
            <p class="post-date">
              ${timeAgo}
            </p>
          </li>
        `;
          })
          .join("")}
        ${
          displayedPosts.length === 0
            ? '<p class="no-posts">Постов пока нет</p>'
            : ""
        }
      </ul>
    </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  // Обработчики для лайков
  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!user) {
        alert("Нужно авторизоваться чтобы ставить лайки");
        return;
      }

      const postId = button.dataset.postId;
      const postElement = button.closest(".post");
      const likesText = postElement.querySelector(".post-likes-text strong");
      const likeImg = button.querySelector("img");

      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.some((like) => like.id === user.id);

      // Оптимистичное обновление UI
      if (isLiked) {
        post.likes = post.likes.filter((like) => like.id !== user.id);
        likesText.textContent = post.likes.length;
        likeImg.src = "./assets/images/like-not-active.svg";

        dislikePost({ token: `Bearer ${user.token}`, postId }).catch(
          (error) => {
            console.error("Ошибка при удалении лайка:", error);
            // Откатываем изменения при ошибке
            post.likes.push(user);
            likesText.textContent = post.likes.length;
            likeImg.src = "./assets/images/like-active.svg";
          }
        );
      } else {
        post.likes.push(user);
        likesText.textContent = post.likes.length;
        likeImg.src = "./assets/images/like-active.svg";

        likePost({ token: `Bearer ${user.token}`, postId }).catch((error) => {
          console.error("Ошибка при добавлении лайка:", error);
          // Откатываем изменения при ошибке
          post.likes = post.likes.filter((like) => like.id !== user.id);
          likesText.textContent = post.likes.length;
          likeImg.src = "./assets/images/like-not-active.svg";
        });
      }
    });
  });

  // Обработчики для перехода на страницу пользователя
  document.querySelectorAll(".post-header").forEach((userEl) => {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  });
}

// Вспомогательная функция для форматирования времени
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "только что";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} минут назад`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} часов назад`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} дней назад`;
  }
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
