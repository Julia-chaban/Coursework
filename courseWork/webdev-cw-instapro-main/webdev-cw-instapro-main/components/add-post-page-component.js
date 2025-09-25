import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  let imageUrl = "";
  let description = "";

  const render = () => {
    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Добавить пост</h3>
        <div class="form-inputs">
          <div class="upload-image-container"></div>
          <textarea 
            id="description-textarea" 
            class="textarea input" 
            placeholder="Опишите вашу фотографию..."
            rows="4"
            maxlength="500"
          >${description}</textarea>
          <div class="char-counter">${description.length}/500</div>
          <div class="form-error" id="form-error"></div>
          <button class="button" id="add-button" ${
            !imageUrl ? 'disabled="true"' : ""
          }>
            ${!imageUrl ? "Загрузите изображение" : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  `;

    appEl.innerHTML = appHtml;

    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    const uploadImageContainer = appEl.querySelector(".upload-image-container");
    if (uploadImageContainer) {
      renderUploadImageComponent({
        element: uploadImageContainer,
        onImageUrlChange(newImageUrl) {
          imageUrl = newImageUrl;
          const addButton = document.getElementById("add-button");
          const errorElement = document.getElementById("form-error");

          if (addButton) {
            if (imageUrl) {
              addButton.disabled = false;
              addButton.textContent = "Опубликовать";
              errorElement.textContent = "";
            } else {
              addButton.disabled = true;
              addButton.textContent = "Загрузите изображение";
            }
          }
        },
      });
    }

    const descriptionTextarea = document.getElementById("description-textarea");
    const charCounter = document.querySelector(".char-counter");

    if (descriptionTextarea) {
      descriptionTextarea.value = description;
      descriptionTextarea.addEventListener("input", (e) => {
        description = e.target.value;
        if (charCounter) {
          charCounter.textContent = `${description.length}/500`;
        }
      });
    }

    const addButton = document.getElementById("add-button");
    if (addButton) {
      addButton.addEventListener("click", () => {
        const errorElement = document.getElementById("form-error");

        // Валидация
        if (!imageUrl) {
          errorElement.textContent = "Пожалуйста, загрузите изображение";
          return;
        }

        if (!description.trim()) {
          errorElement.textContent = "Пожалуйста, добавьте описание";
          return;
        }

        if (description.trim().length < 3) {
          errorElement.textContent =
            "Описание должно содержать минимум 3 символа";
          return;
        }

        if (description.trim().length > 500) {
          errorElement.textContent =
            "Описание не должно превышать 500 символов";
          return;
        }

        // Очищаем ошибки
        errorElement.textContent = "";

        // Блокируем кнопку на время отправки
        addButton.disabled = true;
        addButton.textContent = "Публикую...";

        onAddPostClick({
          description: description.trim(),
          imageUrl: imageUrl,
        });
      });
    }
  };

  render();
}
