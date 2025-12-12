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

      const container = document.createElement("div");
      container.style.margin = "10px 0";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Type radical...";
      input.style.padding = "4px";

      const btn = document.createElement("button");
      btn.textContent = "Submit";
      btn.style.marginLeft = "5px";

      // Handle button click
      btn.addEventListener("click", () => {
        // Handle submit
        console.log("Submitted - button pressed");
        this.handleSubmit(input.value);
      });

      // Handle Enter key
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          // handle submit
          console.log("Submitted - enter pressed");
          this.handleSubmit(input.value);
        }
      });

      container.appendChild(input);
      container.appendChild(btn);

      const parent = subjectSection.querySelector(".subject-section__content");
      const subjectListDiv = subjectSection.querySelector(".subject-list");

      parent.insertBefore(container, subjectListDiv);
    },

    initRadicalCovers() {
      // -----------------------
      // Set up radical covers

      const subjectSection = state.lesson.radicalsSection;

      const subjectItems = subjectSection.querySelector(
        ".subject-list__items"
      ).children;

      console.log("[WK] subjectItems", subjectItems);

      for (let index = 0; index < subjectItems.length; index++) {
        const itemContentDiv = subjectItems[index].querySelector(
          ".subject-character__content"
        );

        console.log("[WK] itemContentDiv", itemContentDiv);

        const coverDiv = document.createElement("div");
        coverDiv.className = "subject-character__cover";

        const rect = itemContentDiv.getBoundingClientRect();
        coverDiv.style.width = rect.width + "px";
        coverDiv.style.height = rect.height + "px";

        coverDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.revealRadical();
        });

        itemContentDiv.appendChild(coverDiv);

        const title = subjectItems[index].querySelector(
          ".subject-character__meaning"
        ).textContent;

        const radical = new Radical(title, coverDiv);
        state.lesson.radicals.push(radical);
      }
    },

    handleSubmit(input) {
      const normalizeText = (text) => {
        return text.trim().toLowerCase();
      };

      const radicals = state.lesson.radicals;

      const matchingRadicalIndex = radicals.findIndex(
        (radical) =>
          radical.isCovered &&
          normalizeText(radical.title) == normalizeText(input)
      );

      if (matchingRadicalIndex !== -1) {
        this.revealRadical(radicals[matchingRadicalIndex]);
      } else {
        // Buzz
      }
    },

    revealRadical(radical) {
      radical.coverElement.remove();
      radical.isCovered = false;
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
            border-color: var(--color-blue-dark);
            border: 1px solid;
            position: absolute;
            cursor: pointer;
            z-index: 999999;
        }
    `;
    const styleEl = document.createElement("style");
    styleEl.id = "css_radical-guessr";
    styleEl.textContent = cssStyle;
    document.head.appendChild(styleEl);
  }
})();

/**
 *
 * <section class="subject-section" title="Radical Composition">
   <h2 class="subject-section__title">
      <span class="subject-section__title-text">Radical Composition</span>
   </h2>

   <section class="subject-section__content">
      <p class="wk-text wk-text--bottom-loose">The kanji is composed of three radicals. Can you GUESS WHAT THE RADICALS ARE?</p>

      <div class="subject-list">
         <ul class="subject-list__items">

            <li class="subject-list__item">
               <a class="subject-character subject-character--radical subject-character--small-with-meaning subject-character--unlocked" title="Gold" href="https://www.wanikani.com/radicals/gold">
                  <div class="subject-character__content">
                     <span class="subject-character__characters">
                     <span class="subject-character__characters-text" lang="ja">
                     金
                     </span>
                     </span>
                     <div class="subject-character__info">
                        <span class="subject-character__meaning">Gold</span>
                     </div>
                  </div>
               </a>
            </li>

            <li class="subject-list__item">
               <a class="subject-character subject-character--radical subject-character--small-with-meaning subject-character--unlocked" title="Stand" href="https://www.wanikani.com/radicals/stand">
                  <div class="subject-character__content">
                     <span class="subject-character__characters">
                     <span class="subject-character__characters-text" lang="ja">
                     立
                     </span>
                     </span>
                     <div class="subject-character__info">
                        <span class="subject-character__meaning">Stand</span>
                     </div>
                  </div>
               </a>
            </li>

            <li class="subject-list__item">
               <a class="subject-character subject-character--radical subject-character--small-with-meaning subject-character--unlocked" title="See" href="https://www.wanikani.com/radicals/see">
                  <div class="subject-character__content">
                     <span class="subject-character__characters">
                     <span class="subject-character__characters-text" lang="ja">
                     見
                     </span>
                     </span>
                     <div class="subject-character__info">
                        <span class="subject-character__meaning">See</span>
                     </div>
                  </div>
               </a>
            </li>
         </ul>
      </div>
   </section>
</section>

 */
