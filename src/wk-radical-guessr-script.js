// ==UserScript==
// @name         WaniKani RadicalGuessr
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Allows you to guess the radicals for a kanji in lessons.
// @author       romans-boi
// @license      MIT
// @match        https://www.wanikani.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(async function () {
  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Constants and other important variables
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  const RADICAL_SECTION_TITLE_KEY = "Radical Composition";

  const state = {
    pageUrl: null,
    lesson: {
      radicalsSection: null,
      radicals: [],
    },
  };

  class Radical {
    constructor(title, coverElement) {
      this.title = title;
      this.coverElement = coverElement;
      this.isCovered = true;
    }
  }

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Initialising and setting up the script
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  window.addEventListener("turbo:load", onTurboLoad);

  function onTurboLoad() {
    state.pageUrl = window.location.pathname;

    const runApp = () => {
      router();
    };

    runApp();
  }

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Router setup for handling correct page setups
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  function router() {
    console.log("router");
    const { pageUrl } = state;

    console.log(pageUrl);

    if (/subject-lessons/.test(pageUrl)) {
      LessonPage.init();
    } else {
      // Nothing to be done at the moment
    }
  }

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Review page 'module' which handles setting up the relevant bits for the review page
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  const LessonPage = {
    async init() {
      console.log("LessonPage.init");
      addStyle();

      const element = await waitForElement(".subject-section", 10);
      console.log("[WK] Element", element);

      if (element.title == RADICAL_SECTION_TITLE_KEY) {
        console.log("[WK] Matched title");
        state.lesson.radicalsSection = element;
        RadicalQuiz.init();
      }
    },
  };

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Review page 'module' which handles setting up the relevant bits for the review page
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  const RadicalQuiz = {
    async init() {
      console.log("[WK] RadicalQUiz.init");

      this.initInput();
      this.initRadicalCovers();
    },

    initInput() {
      const subjectSection = state.lesson.radicalsSection;

      if (subjectSection.querySelector("radical__input-container")) return;

      const container = document.createElement("div");
      container.className = "radical__input-container";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Type radical...";
      input.className = "radical__input";

      const buttonInnerHtml = `
        <svg class="wk-icon wk-icon--chevron_right" viewBox="0 0 320 512" aria-hidden="true">
            <use href="#wk-icon__chevron-right"></use>
        </svg>
      `;

      const btn = document.createElement("button");
      btn.className = "radical__input-submit-button";
      btn.innerHTML = buttonInnerHtml;

      // Handle button click
      btn.addEventListener("click", () => {
        // Handle submit
        console.log("Submitted - button pressed");
        this.handleSubmit(input);
      });

      // Handle Enter key
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          // handle submit
          console.log("Submitted - enter pressed");
          this.handleSubmit(input);
        }
      });

      container.appendChild(input);
      container.appendChild(btn);

      const parent = subjectSection.querySelector(".subject-section__content");
      const subjectListDiv = subjectSection.querySelector(".subject-list");

      parent.insertBefore(container, subjectListDiv);
    },

    initRadicalCovers() {
      const subjectSection = state.lesson.radicalsSection;

      if (subjectSection.querySelector("subject-character__cover")) return;

      const subjectItems = subjectSection.querySelector(
        ".subject-list__items"
      ).children;

      console.log("[WK] subjectItems", subjectItems);

      for (let index = 0; index < subjectItems.length; index++) {
        const title = subjectItems[index].querySelector(
          ".subject-character__meaning"
        ).textContent;

        const itemContentDiv = subjectItems[index].querySelector(
          ".subject-character__content"
        );

        console.log("[WK] itemContentDiv", itemContentDiv);

        const coverDiv = document.createElement("div");
        coverDiv.className = "subject-character__cover";

        const rect = itemContentDiv.getBoundingClientRect();
        coverDiv.style.width = rect.width + "px";
        coverDiv.style.height = rect.height + "px";

        const radical = new Radical(title, coverDiv);

        coverDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.revealRadical(radical);
        });

        itemContentDiv.appendChild(coverDiv);

        state.lesson.radicals.push(radical);
      }
    },

    handleSubmit(input) {
      const inputText = input.value;

      const normalizeText = (text) => {
        return text.trim().toLowerCase();
      };

      const radicals = state.lesson.radicals;

      const matchingRadicalIndex = radicals.findIndex(
        (radical) =>
          radical.isCovered &&
          normalizeText(radical.title) == normalizeText(inputText)
      );

      if (matchingRadicalIndex !== -1) {
        input.value = "";
        this.revealRadical(radicals[matchingRadicalIndex]);
      } else {
        console.log("incorrect!");
        for (let index = 0; index < radicals.length; index++) {
          const radical = radicals[index];
          if ([...radical.coverElement.classList].includes("incorrect")) break;

          radical.coverElement.classList.add("incorrect");

          setTimeout(() => {
            radical.coverElement.classList.remove("incorrect");
          }, 1000);
        }
      }
    },

    revealRadical(radical) {
      radical.coverElement.classList.add("correct");

      //   setTimeout(() => {
      //     radical.coverElement.classList.add("fade-out");
      //   }, 500);

      //   setTimeout(() => {
      //     radical.coverElement.remove();
      //     radical.isCovered = false;
      //   }, 1000);
    },
  };

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Utils and helpers
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  function waitForElement(selector, interval = 50) {
    return new Promise((resolve) => {
      const handle = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(handle);
          resolve(element);
        }
      }, interval);
    });
  }

  // ==========================================================================================
  // ------------------------------------------------------------------------------------------
  // Styling
  // ------------------------------------------------------------------------------------------
  // ==========================================================================================

  function addStyle() {
    // Add CSS style for current SRS elements
    const cssStyle = `
        .subject-character__cover {
            border-radius: 8px;
            background: var(--color-blue);
            border: 1px solid var(--color-blue-dark);
            position: absolute;
            cursor: pointer;
            z-index: 999999;
            transition:none;
        }
    
        .subject-character__cover.correct {
            opacity: 0;
            transition: opacity 1s linear;
        }        

        @keyframes incorrectAnimation {
            0% { background-color: var(--color-quiz-incorrect-background); }
            20% { background-color: var(--color-quiz-incorrect-background); }
            100% { background-color: var(--color-blue); }
        }

        .subject-character__cover.incorrect {
            animation-name: incorrectAnimation;
            animation-duration: 1s;
        }        

        .subject-character__cover.fade-out {
            opacity: 0;
            transition:all .5s ease-in;
        }

        .radical__input-container {
            margin-bottom: var(--spacing-normal);
            position:relative;
            display:inline-flex;
        }

        .radical__input {
            font-weight: 400;
            line-height: 1.4;
            font-size: 16px;
            text-shadow: 0 1px 0 #fff;
            box-shadow: 3px 3px 0 #e1e1e1;
            padding: 10px;
            border: 2px solid rgba(0,0,0,0);
            background-color: var(--color-quiz-input-background);
            outline: none;
        }

        .radical__input:focus {
            border-color:var(--color-quiz-input-focus)
        }

        .radical__input-submit-button {
            cursor: pointer;
            position: absolute;
            top: 10px;
            right: 0px;
            bottom: 10px;
            background: rgba(0,0,0,0);
            border: 0;
            padding: 0 12px;
            font-size: 16px;
            color: inherit;
        }
    `;
    const styleEl = document.createElement("style");
    styleEl.id = "css_radical-guessr";
    styleEl.textContent = cssStyle;
    document.head.appendChild(styleEl);
  }
})();
