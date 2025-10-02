import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { likePost, dislikePost } from "../api.js";

export function renderPostsPageComponent({ appEl }) {
  console.log("🔄 Рендерим страницу постов");

  const currentUser = user || JSON.parse(localStorage.getItem("user"));
  console.log("👤 Текущий пользователь для лайков:", {
    id: currentUser?.id,
    _id: currentUser?._id,
    name: currentUser?.name,
  });

  // Детальный анализ определения лайков
  posts.forEach((post, index) => {
    const isLiked =
      currentUser && post.likes
        ? post.likes.some((like) => {
            const likeUserId = like.id || like._id;
            const currentUserId = currentUser.id || currentUser._id;
            const match = likeUserId === currentUserId;

            console.log(`🔍 Пост "${post.description.substring(0, 30)}...":`, {
              likeUserId: likeUserId,
              currentUserId: currentUserId,
              match: match,
              likeObject: like,
            });

            return match;
          })
        : false;

    console.log(`🎯 Итог для поста ${index + 1}:`, {
      description: post.description.substring(0, 30) + "...",
      likesCount: post.likes ? post.likes.length : 0,
      isLiked: isLiked,
      postId: post.id,
    });
  });

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <ul class="posts">
        ${posts
          .map((post) => {
            // ВАЖНО: Правильное определение лайка
            const isLiked =
              currentUser && post.likes
                ? post.likes.some((like) => {
                    const likeUserId = like.id || like._id;
                    const currentUserId = currentUser.id || currentUser._id;
                    return likeUserId === currentUserId;
                  })
                : false;

            const likesCount = post.likes ? post.likes.length : 0;
            const timeAgo = formatTimeAgo(new Date(post.createdAt));

            console.log(
              `🎨 Рендерим пост "${post.description.substring(
                0,
                30
              )}...": isLiked = ${isLiked}`
            );

            return `
          <li class="post" data-post-id="${post.id}">
            <div class="post-header" data-user-id="${post.user.id}">
                <img src="${
                  post.user.imageUrl
                }" class="post-header__user-image" onerror="handleImageError(this)">
                <p class="post-header__user-name">${post.user.name}</p>
            </div>
            <div class="post-image-container">
              <img class="post-image" src="${
                post.imageUrl
              }" onerror="handleImageError(this)">
            </div>
            <div class="post-likes">
              <button data-post-id="${post.id}" class="like-button">
                <img src="./assets/images/like-${
                  isLiked ? "active" : "not-active"
                }.svg" 
                     alt="${isLiked ? "Убрать лайк" : "Поставить лайк"}">
              </button>
              <p class="post-likes-text">
                Нравится: <strong>${likesCount}</strong>
              </p>
            </div>
            <p class="post-text">
              <span class="user-name">${post.user.name}</span>
              ${post.description}
            </p>
            <p class="post-date">
              ${timeAgo}
            </p>
          </li>
        `;
          })
          .join("")}
      </ul>
    </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  // Обработчики лайков
  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => {
      const currentUser = user || JSON.parse(localStorage.getItem("user"));
      const currentUserId = currentUser?.id || currentUser?._id;

      if (!currentUser) {
        alert("Нужно авторизоваться чтобы ставить лайки");
        return;
      }

      const postId = button.dataset.postId;
      const likeImg = button.querySelector("img");
      const likesText = button
        .closest(".post-likes")
        .querySelector(".post-likes-text strong");

      const postIndex = posts.findIndex((p) => p.id === postId);
      if (postIndex === -1) return;

      const post = posts[postIndex];

      // Детальная проверка перед действием
      const isCurrentlyLiked = post.likes.some((like) => {
        const likeUserId = like.id || like._id;
        const match = likeUserId === currentUserId;
        console.log(
          `🖱️ Проверка перед кликом: like ${likeUserId} vs user ${currentUserId} = ${match}`
        );
        return match;
      });

      const currentLikesCount = post.likes.length;

      console.log("🎯 Перед действием:", {
        postId,
        isCurrentlyLiked,
        currentLikesCount,
        currentUserId,
      });

      if (isCurrentlyLiked) {
        // Убираем лайк
        likesText.textContent = currentLikesCount - 1;
        likeImg.src = "./assets/images/like-not-active.svg";
        console.log("➖ Убираем лайк");

        dislikePost({ token: `Bearer ${currentUser.token}`, postId })
          .then((response) => {
            console.log("✅ Сервер подтвердил удаление лайка");
            if (response && response.post) {
              posts[postIndex] = response.post;
              console.log("🔄 Обновили пост в массиве");
            }
          })
          .catch((error) => {
            console.error("❌ Ошибка:", error);
            likesText.textContent = currentLikesCount;
            likeImg.src = "./assets/images/like-active.svg";
          });
      } else {
        // Ставим лайк
        likesText.textContent = currentLikesCount + 1;
        likeImg.src = "./assets/images/like-active.svg";
        console.log("➕ Ставим лайк");

        likePost({ token: `Bearer ${currentUser.token}`, postId })
          .then((response) => {
            console.log("✅ Сервер подтвердил добавление лайка");
            if (response && response.post) {
              posts[postIndex] = response.post;
              console.log("🔄 Обновили пост в массиве");
            }
          })
          .catch((error) => {
            console.error("❌ Ошибка:", error);
            likesText.textContent = currentLikesCount;
            likeImg.src = "./assets/images/like-not-active.svg";
          });
      }
    });
  });

  document.querySelectorAll(".post-header").forEach((userEl) => {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  });
}

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
