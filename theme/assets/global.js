/**
 * ShroomHarvest — global.js
 * Deliberately minimal, vanilla JS. No framework, no bundler — every
 * feature here is progressive enhancement over markup that already works
 * without JS (forms submit natively, links navigate normally).
 */
(function () {
  "use strict";

  /* -----------------------------------------------------------------
     Mobile nav toggle
     ----------------------------------------------------------------- */
  var navToggle = document.querySelector("[data-mobile-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* -----------------------------------------------------------------
     Product image gallery — swap main image on thumbnail click
     ----------------------------------------------------------------- */
  var thumbs = document.querySelectorAll("[data-product-thumbs] .product-gallery__thumb");
  var mainImage = document.getElementById("ProductMainImage");

  if (thumbs.length && mainImage) {
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var fullSrc = thumb.getAttribute("data-full-src");
        if (!fullSrc) return;
        mainImage.src = fullSrc;
        thumbs.forEach(function (t) {
          t.classList.toggle("is-active", t === thumb);
        });
      });
    });
  }

  /* -----------------------------------------------------------------
     Quantity stepper (product page + cart page share this markup)
     ----------------------------------------------------------------- */
  document.querySelectorAll("[data-quantity-decrease], [data-quantity-increase]").forEach(function (button) {
    button.addEventListener("click", function () {
      var wrapper = button.closest(".quantity-input");
      if (!wrapper) return;
      var input = wrapper.querySelector('input[type="number"]');
      if (!input) return;

      var min = parseInt(input.getAttribute("min") || "0", 10);
      var current = parseInt(input.value || "0", 10) || 0;
      var delta = button.hasAttribute("data-quantity-decrease") ? -1 : 1;
      var next = Math.max(min, current + delta);

      input.value = String(next);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });

  /* -----------------------------------------------------------------
     Product variant picker — maps selected option values to a variant id
     and updates price + availability, using the JSON data island
     main-product.liquid embeds (no network request needed).
     ----------------------------------------------------------------- */
  var variantsJsonEl = document.getElementById("ProductVariantsJson");
  var optionSelects = document.querySelectorAll("[data-option-select]");
  var variantIdInput = document.getElementById("ProductVariantId");
  var priceEl = document.getElementById("ProductPrice");
  var addToCartButton = document.querySelector("[data-add-to-cart-button]");

  if (variantsJsonEl && optionSelects.length && variantIdInput) {
    var variants;
    try {
      variants = JSON.parse(variantsJsonEl.textContent);
    } catch (e) {
      variants = [];
    }

    function formatMoney(cents) {
      return "$" + (cents / 100).toFixed(2);
    }

    function findMatchingVariant() {
      var selected = Array.prototype.map.call(optionSelects, function (select) {
        return select.value;
      });

      return variants.find(function (variant) {
        var options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
        return selected.every(function (value, index) {
          return options[index] === value;
        });
      });
    }

    function updateForVariant(variant) {
      if (!variant) return;

      variantIdInput.value = variant.id;

      if (priceEl) {
        var html = '<span class="price">' + formatMoney(variant.price) + "</span>";
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          html += '<span class="price--compare">' + formatMoney(variant.compare_at_price) + "</span>";
        }
        priceEl.innerHTML = html;
      }

      if (addToCartButton) {
        addToCartButton.disabled = !variant.available;
        addToCartButton.textContent = variant.available ? "Add to cart" : "Sold out";
      }
    }

    optionSelects.forEach(function (select) {
      select.addEventListener("change", function () {
        updateForVariant(findMatchingVariant());
      });
    });
  }
  /* -----------------------------------------------------------------
     Customer reviews carousel — prev/next buttons scroll the track.
     Works without JS too: it's a native horizontally-scrollable/swipeable
     element (scroll-snap in CSS) even with these buttons removed.
     ----------------------------------------------------------------- */
  document.querySelectorAll("[data-reviews-track]").forEach(function (track) {
    var wrap = track.closest(".reviews-carousel-wrap");
    if (!wrap) return;

    var prevBtn = wrap.querySelector("[data-reviews-prev]");
    var nextBtn = wrap.querySelector("[data-reviews-next]");
    var firstCard = track.querySelector(".review-card");
    var scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 320;

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        track.scrollBy({ left: scrollAmount, behavior: "smooth" });
      });
    }
  });
})();
