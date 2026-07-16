/**
 * ShroomHarvest — Mushroom Finder Quiz
 *
 * Deliberately self-contained and vanilla: no framework, no build step.
 * Scoped to run only on pages that actually have the quiz section
 * (checks for [data-quiz-root] before doing anything), so this file
 * being loaded on every page costs nothing on pages without the quiz.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-quiz-root]");
  if (!root) return;

  var card = root.querySelector("[data-quiz-card]");
  var questions = Array.prototype.slice.call(root.querySelectorAll("[data-quiz-question]"));
  var progressBar = root.querySelector("[data-quiz-progress-bar]");
  var stepLabel = root.querySelector("[data-quiz-step-label]");
  var backButton = root.querySelector("[data-quiz-back]");
  var resultsEl = root.querySelector("[data-quiz-results]");
  var resultsHeading = root.querySelector("[data-quiz-results-heading]");
  var resultsSubheading = root.querySelector("[data-quiz-results-subheading]");
  var resultsGrid = root.querySelector("[data-quiz-results-grid]");
  var resultsEmpty = root.querySelector("[data-quiz-results-empty]");
  var retakeButton = root.querySelector("[data-quiz-retake]");
  var tagPrefix = root.getAttribute("data-tag-prefix") || "goal-";

  var productsScript = document.querySelector("[data-quiz-products]");
  var products = [];
  try {
    products = productsScript ? JSON.parse(productsScript.textContent) : [];
  } catch (e) {
    products = [];
  }

  var GOAL_LABELS = {
    cooking: "Cooking",
    wellness: "Wellness",
    immune: "Immune Support",
    focus: "Focus",
    energy: "Energy",
    growing: "Home Growing",
  };

  var currentStep = 0;
  var answers = []; // answers[i] = goal chosen for question i

  function updateProgress() {
    var pct = questions.length ? Math.round((currentStep / questions.length) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + "%";
    if (stepLabel) {
      stepLabel.textContent = "Question " + Math.min(currentStep + 1, questions.length) + " of " + questions.length;
    }
    if (backButton) backButton.hidden = currentStep === 0;
  }

  function showStep(index) {
    questions.forEach(function (q, i) {
      q.hidden = i !== index;
    });
    currentStep = index;
    updateProgress();
  }

  function tallyScores() {
    var scores = {};
    answers.forEach(function (goal) {
      if (!goal) return;
      scores[goal] = (scores[goal] || 0) + 1;
    });
    return scores;
  }

  function topGoals(scores) {
    var max = 0;
    Object.keys(scores).forEach(function (goal) {
      if (scores[goal] > max) max = scores[goal];
    });
    if (max === 0) return [];
    return Object.keys(scores).filter(function (goal) {
      return scores[goal] === max;
    });
  }

  function matchProducts(goals) {
    var wantedTags = goals.map(function (goal) {
      return (tagPrefix + goal).toLowerCase();
    });

    return products.filter(function (product) {
      var tags = (product.tags || []).map(function (t) {
        return String(t).toLowerCase();
      });
      return wantedTags.some(function (tag) {
        return tags.indexOf(tag) !== -1;
      });
    });
  }

  function renderProductCard(product) {
    var card = document.createElement("a");
    card.href = product.url;
    card.className = "product-card";

    var mediaHtml = product.image
      ? '<img src="' + product.image + '" alt="' + escapeHtml(product.title) + '" width="400" height="400" loading="lazy">'
      : "";

    card.innerHTML =
      '<div class="product-card__media">' + mediaHtml + "</div>" +
      '<div class="product-card__body">' +
      '<span class="product-card__title">' + escapeHtml(product.title) + "</span>" +
      '<span class="price">' + escapeHtml(product.price) + "</span>" +
      "</div>";

    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function showResults() {
    card.hidden = true;

    var scores = tallyScores();
    var winners = topGoals(scores);
    var matches = matchProducts(winners);

    var winnerLabel = winners.map(function (g) { return GOAL_LABELS[g]; }).join(" & ") || "your goals";

    if (resultsHeading) {
      resultsHeading.textContent = "Because you're focused on " + winnerLabel + ", we recommend:";
    }
    if (resultsSubheading) {
      resultsSubheading.textContent =
        matches.length > 0
          ? "Based on your answers, here's what fits best."
          : "";
    }

    resultsGrid.innerHTML = "";

    if (matches.length > 0) {
      resultsEmpty.hidden = true;
      matches.slice(0, 8).forEach(function (product) {
        resultsGrid.appendChild(renderProductCard(product));
      });
    } else {
      resultsEmpty.hidden = false;
      // Fall back to showing whatever products are available so the quiz
      // never dead-ends into a blank page, e.g. before a merchant has
      // tagged any products with the goal-* convention yet.
      products.slice(0, 8).forEach(function (product) {
        resultsGrid.appendChild(renderProductCard(product));
      });
    }

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetQuiz() {
    answers = [];
    resultsEl.hidden = true;
    card.hidden = false;
    showStep(0);
  }

  root.querySelectorAll("[data-quiz-answer]").forEach(function (button) {
    button.addEventListener("click", function () {
      var goal = button.getAttribute("data-goal");
      answers[currentStep] = goal;

      if (currentStep + 1 < questions.length) {
        showStep(currentStep + 1);
      } else {
        showResults();
      }
    });
  });

  if (backButton) {
    backButton.addEventListener("click", function () {
      if (currentStep > 0) showStep(currentStep - 1);
    });
  }

  if (retakeButton) {
    retakeButton.addEventListener("click", resetQuiz);
  }

  showStep(0);
})();
