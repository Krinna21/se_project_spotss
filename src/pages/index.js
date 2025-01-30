import "./index.css";
import Api from "../utils/Api.js";

// Import the image
import stepsSrc from "../images/steps.png";

// Select the element and set the src
const stepsImage = document.getElementById("image-steps");
stepsImage.src = stepsSrc;

import {
  enableValidation,
  validationConfig,
  resetValidation,
  toggleButtonState,
} from "../scripts/validation.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "a526df05-2ddd-436b-bd8a-2e93024347e2",
    "Content-Type": "application/json",
  },
});

document.querySelector(".cards__list").addEventListener("click", (event) => {
  if (event.target.classList.contains("card__like-btn")) {
    const likeButton = event.target;
    const cardElement = likeButton.closest(".card");
    const cardId = cardElement.dataset.id;
    const isLiked = likeButton.classList.contains("card__like-btn_active");

    api
      .toggleLike(cardId, isLiked)
      .then((updatedCard) => {
        likeButton.classList.toggle(
          "card__like-btn_active",
          updatedCard.isLiked
        );
      })
      .catch((err) => console.error(err));
  }
});

api
  .getAppInfo()
  .then(([cards, user]) => {
    console.log("User data:", user);

    const { name, about, avatar } = user;

    // Set user name, description, and avatar
    profileName.textContent = name;
    profileDescription.textContent = about;
    profileAvatar.src = avatar;

    cards.forEach((item) => {
      const cardEl = getCardElement(item);
      cardsList.append(cardEl);
    });
  })
  .catch(console.error);

// Card Elements
const profileEditButton = document.querySelector(".profile__edit-btn");
const cardEditButton = document.querySelector(".profile__add-btn");
const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");

// Modal Elements
const editModal = document.querySelector("#edit-modal");
const cardModal = document.querySelector("#add-card-modal");
const previewModal = document.querySelector("#preview-modal");

// Form Elements
const editForm = editModal.querySelector(".modal__form");
const cardForm = cardModal.querySelector(".modal__form");

// Input Elements (cached for reuse)
const profileNameInput = editModal.querySelector("#profile-name-input");
const profileDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

// Avatar Elements
const avatarModal = document.querySelector("#avatar-modal");
const avatarForm = avatarModal.querySelector(".modal__form");
const profileAvatar = document.querySelector(".profile__avatar");
const avatarSubmitBtn = avatarModal.querySelector(".modal__form");
const avatarModalCloseBtn = avatarModal.querySelector(".modal__close-btn");
const avatarInput = avatarModal.querySelector("#profile-avatar-input");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");

// Delete Elements
const deleteModal = document.querySelector("#delete-modal");
const deleteForm = document.querySelector("#edit-delete-profile");

// Close Buttons
const editModalCloseBtn = editModal.querySelector(".modal__close-btn");
const cardModalCloseBtn = cardModal.querySelector(".modal__close-btn");
const previewModalCloseBtn = previewModal.querySelector(
  ".modal__close-btn_type_preview"
);

// Preview Elements
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaptionEl = previewModal.querySelector(".modal__caption");

// Card List and Template
const cardsList = document.querySelector(".cards__list");
const cardTemplate = document.querySelector("#card-template");

// Open Modal
function openModal(modal) {
  modal.classList.add("modal_opened");
  document.addEventListener("keydown", closeModalByEscape); // Adds Escape key listener
  const formEl = modal.querySelector(".modal__form");
}

// Close Modal
function closeModal(modal) {
  modal.classList.remove("modal_opened");
  document.removeEventListener("keydown", closeModalByEscape); // Removes Escape key listener
}

// Function to close modal on Escape key
function closeModalByEscape(event) {
  if (event.key === "Escape") {
    const openedModal = document.querySelector(".modal_opened");
    if (openedModal) {
      closeModal(openedModal);
    }
  }
}

// Handle Edit Form Submit
function handleEditFormSubmit(evt) {
  evt.preventDefault();

  api
    .editUserInfo({
      name: profileNameInput.value,
      about: profileDescriptionInput.value,
    })
    .then((data) => {
      profileName.textContent = data.name; // Use updated data from the server
      profileDescription.textContent = data.about;
      closeModal(editModal);
    })
    .catch(console.error);
}

// Handle Add Card Submit
function handleAddCardSubmit(evt) {
  evt.preventDefault();

  const cardData = {
    name: cardNameInput.value,
    link: cardLinkInput.value,
  };

  api
    .addCard(cardData)
    .then((newCard) => {
      const cardElement = getCardElement(newCard); // Render the new card
      cardsList.prepend(cardElement); // Add to the top of the card list
      cardForm.reset(); // Reset the form
      closeModal(cardModal);

      toggleButtonState(
        Array.from(cardForm.querySelectorAll(validationConfig.inputSelector)),
        cardForm.querySelector(validationConfig.submitButtonSelector),
        validationConfig
      );
    })
    .catch(console.error);
}

//Avatar Handler
function handleAvatarSubmit(evt) {
  evt.preventDefault();
  api
    .editAvatarInfo(avatarInput.value)
    .then((data) => {
      document.querySelector(".profile__avatar").src = data.avatar;
      closeModal(avatarModal);
      avatarForm.reset();
    })
    .catch(console.error);
}

// Form Submission Handlers
editForm.addEventListener("submit", handleEditFormSubmit);
cardForm.addEventListener("submit", handleAddCardSubmit);
avatarForm.addEventListener("submit", handleAvatarSubmit);

avatarModalBtn.addEventListener("click", () => {
  openModal(avatarModal);
});

// Create Card Element
function getCardElement(data) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardNameEl = cardElement.querySelector(".card__title");
  const cardLikeBtn = cardElement.querySelector(".card__like-btn");
  const cardDeleteBtn = cardElement.querySelector(".card__delete-btn");
  cardNameEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;
  cardLikeBtn.addEventListener("click", () => {
    cardLikeBtn.classList.toggle("card__like-btn_active");
  });
  cardImageEl.addEventListener("click", () => {
    previewModalCaptionEl.textContent = data.name;
    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
    openModal(previewModal);
  });
  cardDeleteBtn.addEventListener("click", () => {
    handleDeleteCard(cardElement, data);
  });
  return cardElement;
}

let selectedCard = null;
let selectedCardId = null;

// Delete modal
function handleDeleteCard(cardElement, data) {
  selectedCard = cardElement;
  selectedCardId = data._id;
  openModal(deleteModal);
}

function handleDeleteSubmit(evt) {
  evt.preventDefault();
  api
    .removeCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
    })
    .catch(console.error);
}

// Event Listeners
profileEditButton.addEventListener("click", () => {
  profileNameInput.value = profileName.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  resetValidation(editForm, validationConfig);
  openModal(editModal);
});
editModalCloseBtn.addEventListener("click", () => {
  closeModal(editModal);
});
cardEditButton.addEventListener("click", () => {
  openModal(cardModal);
});
cardModalCloseBtn.addEventListener("click", () => {
  closeModal(cardModal);
});
previewModalCloseBtn.addEventListener("click", () => {
  closeModal(previewModal);
});
deleteForm.addEventListener("submit", handleDeleteSubmit);

// Function to close the modal when clicking outside of it
function closeModalByOverlayClick(event) {
  if (event.target === event.currentTarget) {
    closeModal(event.currentTarget);
  }
}

// Overlay Click Listeners
editModal.addEventListener("mousedown", closeModalByOverlayClick);
cardModal.addEventListener("mousedown", closeModalByOverlayClick);
previewModal.addEventListener("mousedown", closeModalByOverlayClick);
avatarModal.addEventListener("mousedown", closeModalByOverlayClick);

// Call enableValidation function with configuration
enableValidation(validationConfig);
