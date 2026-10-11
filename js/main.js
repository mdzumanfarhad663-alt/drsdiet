/* The Doctor's Diet — prototype behaviour (cart, toggles, menu, cookie banner, forms) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var FREE_SHIP = 75;
  var PRODUCTS = {
    "morning-greens": { name: "Morning Greens Superfood Blend", price: 59.99, img: "assets/product-morning-greens.webp", url: "product-morning-greens.html" },
    "probiotic": { name: "Probiotic 60 Digestive Balance", price: 39.99, img: "assets/product-probiotic.webp", url: "product-probiotic.html" },
    "creatine": { name: "Creatine Monohydrate", price: 39.99, img: "assets/product-creatine.webp", url: "product-creatine.html" },
    "trifecta": { name: "The Daily Trifecta", price: 119.99, img: "assets/bundle-lifestyle.jpg", url: "bundle.html" }
  };
  var SUB_RATE = 0.85;

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var money = function (n) { return "$" + n.toFixed(2); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- cart state ----------
  var cart = [];
  try { cart = JSON.parse(store.get("dd_cart")) || []; } catch (e) { cart = []; }
  cart = cart.filter(function (l) { return PRODUCTS[l.id]; });

  function unitPrice(line) {
    var p = PRODUCTS[line.id].price;
    return line.sub ? Math.round(p * SUB_RATE * 100) / 100 : p;
  }
  function save() { store.set("dd_cart", JSON.stringify(cart)); render(); }
  function add(id, qty, sub) {
    var found = cart.filter(function (l) { return l.id === id && !!l.sub === !!sub; })[0];
    if (found) found.qty += qty; else cart.push({ id: id, qty: qty, sub: !!sub });
    save(); openCart();
  }

  function render() {
    var count = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    var total = cart.reduce(function (a, l) { return a + unitPrice(l) * l.qty; }, 0);
    $$(".cart-count").forEach(function (el) { if (+el.textContent < count) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); } el.textContent = count; el.setAttribute("data-n", count); });

    var items = $("#cart-items");
    if (!items) return;
    if (!cart.length) {
      items.innerHTML = '<div class="empty"><p>Your cart is empty.</p><a class="link" href="bundle.html">Shop the Daily Trifecta →</a></div>';
    } else {
      items.innerHTML = cart.map(function (l, i) {
        var p = PRODUCTS[l.id];
        return '<div class="line-item">' +
          '<img src="' + p.img + '" alt="" width="72" height="72">' +
          '<div><h4>' + p.name + '</h4>' +
          '<div class="sub">' + (l.sub ? "Subscribe &amp; Save 15% · monthly" : "One-time purchase") + '</div>' +
          (l.sub && l.id === "trifecta" ? '<div class="sub">+ FREE eBook: The Ultimate GLP-1 Companion</div>' : "") +
          '<div class="qty" aria-label="Quantity"><button type="button" data-dec="' + i + '" aria-label="Decrease">−</button>' +
          '<input type="number" value="' + l.qty + '" min="1" data-qty="' + i + '" aria-label="Quantity">' +
          '<button type="button" data-inc="' + i + '" aria-label="Increase">+</button></div></div>' +
          '<div class="line-price">' + money(unitPrice(l) * l.qty) +
          '<div><button type="button" class="remove" data-remove="' + i + '">Remove</button></div></div></div>';
      }).join("");
    }

    var left = FREE_SHIP - total;
    $("#ship-msg").textContent = !cart.length ? "Free shipping on orders over $75."
      : left > 0 ? money(left) + " away from free shipping." : "You've unlocked free shipping.";
    $("#ship-bar").style.width = Math.min(100, (total / FREE_SHIP) * 100) + "%";
    $("#cart-subtotal").textContent = money(total);

    var hasBundle = cart.some(function (l) { return l.id === "trifecta"; });
    $("#cart-upsell").hidden = hasBundle;
    $("#checkout").disabled = !cart.length;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add], [data-remove], [data-inc], [data-dec], [data-open-cart], [data-close-cart], #checkout");
    if (!t) return;
    if (t.hasAttribute("data-add")) {
      e.preventDefault();
      var scope = t.closest("[data-product-scope]");
      var sub = scope ? !!$('input[value="sub"]:checked', scope) : false;
      var qtyEl = scope ? $(".pdp-qty", scope) : null;
      var qty = qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;
      add(t.getAttribute("data-add"), qty, sub);
    } else if (t.hasAttribute("data-remove")) {
      cart.splice(+t.getAttribute("data-remove"), 1); save();
    } else if (t.hasAttribute("data-inc")) {
      cart[+t.getAttribute("data-inc")].qty++; save();
    } else if (t.hasAttribute("data-dec")) {
      var l = cart[+t.getAttribute("data-dec")];
      if (l.qty > 1) l.qty--; else cart.splice(+t.getAttribute("data-dec"), 1);
      save();
    } else if (t.hasAttribute("data-open-cart")) {
      e.preventDefault(); openCart();
    } else if (t.hasAttribute("data-close-cart")) {
      closeCart();
    } else if (t.id === "checkout") {
      t.textContent = "Checkout opens in Shopify";
      setTimeout(function () { t.textContent = "Checkout"; }, 2200);
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.hasAttribute("data-qty")) {
      var i = +e.target.getAttribute("data-qty"), v = parseInt(e.target.value, 10);
      if (v > 0) cart[i].qty = v; else cart.splice(i, 1);
      save();
    }
  });

  var lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $("#cart").classList.add("open"); $("#cart-overlay").classList.add("open");
    $("#cart").setAttribute("aria-hidden", "false");
    $("#cart .drawer-head button").focus();
  }
  function closeCart() {
    $("#cart").classList.remove("open"); $("#cart-overlay").classList.remove("open");
    $("#cart").setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("#cart.open")) closeCart(); });

  // ---------- subscribe toggles ----------
  $$("[data-product-scope]").forEach(function (scope) {
    var id = scope.getAttribute("data-product-scope");
    var p = PRODUCTS[id];
    function update() {
      var sub = !!$('input[value="sub"]:checked', scope);
      var price = sub ? Math.round(p.price * SUB_RATE * 100) / 100 : p.price;
      $$("[data-live-price]", scope).forEach(function (el) { el.textContent = money(price) + (sub ? "/mo" : ""); });
      $$(".bonus", scope).forEach(function (el) { el.classList.toggle("show", sub); });
      var sticky = $(".sticky-buy [data-live-price]");
      if (sticky && scope.classList.contains("pdp-info")) sticky.textContent = money(price) + (sub ? "/mo" : "");
    }
    $$('input[type="radio"]', scope).forEach(function (r) { r.addEventListener("change", update); });
    update();
  });

  // quantity stepper on product page
  $$("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = $(".pdp-qty", b.closest(".qty"));
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) + +b.getAttribute("data-step"));
    });
  });

  // gallery thumbs
  $$(".thumbs button").forEach(function (b) {
    b.addEventListener("click", function () {
      var main = $(".gallery-main img");
      main.style.opacity = 0;
      setTimeout(function () { main.src = b.getAttribute("data-src"); main.alt = b.getAttribute("data-alt"); main.style.opacity = 1; }, 180);
      $$(".thumbs button").forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); });
    });
  });

  // sticky add-to-cart bar (mobile): show once main button scrolls away
  var sticky = $(".sticky-buy"), mainBtn = $(".pdp-info .buy-row .btn");
  if (sticky && mainBtn && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      sticky.classList.toggle("show", !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
    }).observe(mainBtn);
  }

  // ---------- mobile menu ----------
  var menuBtn = $(".menu-toggle"), mnav = $(".mobile-nav");
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---------- cookie banner ----------
  var cookie = $("#cookie");
  if (cookie && !store.get("dd_cookie")) cookie.classList.add("show");
  $$("[data-cookie]").forEach(function (b) {
    b.addEventListener("click", function () { store.set("dd_cookie", b.getAttribute("data-cookie")); cookie.classList.remove("show"); });
  });

  // ---------- fake forms ----------
  $$("form[data-fake]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var msg = document.createElement("p");
      msg.className = "form-success"; msg.setAttribute("role", "status");
      msg.textContent = f.getAttribute("data-fake");
      f.replaceWith(msg);
    });
  });

  // lazy videos: load source only when near viewport
  var vids = $$("video[data-src]");
  if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var v = x.target; v.src = v.getAttribute("data-src"); v.removeAttribute("data-src"); vo.unobserve(v);
      });
    }, { rootMargin: "200px" });
    vids.forEach(function (v) { vo.observe(v); });
  } else {
    vids.forEach(function (v) { v.src = v.getAttribute("data-src"); });
  }

  // ---------- motion: header state, scroll reveal ----------
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); ro.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- benefits tabs ----------
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          var n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          select(n); tabs[n].focus();
        }
      });
    });
    function select(i) {
      tabs.forEach(function (t, j) {
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", i === j ? "true" : "false");
        t.tabIndex = i === j ? 0 : -1;
        panel.hidden = i !== j;
        if (i === j) { panel.classList.remove("enter"); void panel.offsetWidth; panel.classList.add("enter"); }
      });
    }
  });

  // ---------- on / off GLP-1 routine switch ----------
  $$("[data-switch]").forEach(function (wrap) {
    var btns = $$("[data-mode]", wrap);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var mode = b.getAttribute("data-mode");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$("[data-on]", wrap).forEach(function (p) {
          p.classList.add("swap");
          setTimeout(function () { p.textContent = p.getAttribute("data-" + mode); p.classList.remove("swap"); }, 220);
        });
      });
    });
  });

  render();
})();
