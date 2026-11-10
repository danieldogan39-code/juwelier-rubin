window.__rubinReady = !0;
var M = window.RUBIN || {},
  Ee = M.mode === "preview" || M.mode === "entwurf",
  O = M.mode === "preview",
  c = (e, a = document) => a.querySelector(e),
  v = (e, a = document) => [...a.querySelectorAll(e)],
  z = (e, a, t) => Math.min(t, Math.max(a, e)),
  q = (e, a, t) => e + (a - e) * t,
  oe = (e) => window.matchMedia && window.matchMedia(e).matches,
  $ = oe("(prefers-reduced-motion: reduce)"),
  _ = oe("(hover: hover) and (pointer: fine)"),
  R = {
    get(e, a = "local") {
      try {
        return JSON.parse((a === "session" ? sessionStorage : localStorage).getItem(e));
      } catch {
        return null;
      }
    },
    set(e, a, t = "local") {
      try {
        (t === "session" ? sessionStorage : localStorage).setItem(e, JSON.stringify(a));
      } catch {}
    },
  },
  V = { y: window.scrollY, v: 0 },
  J = (() => {
    let e = [],
      a = !1,
      t = window.scrollY,
      n = () => {
        a = !1;
        let i = window.scrollY;
        ((V.v = q(V.v, i - t, 0.35)), (V.y = i), (t = i), e.forEach((o) => o()));
      },
      s = () => {
        a || ((a = !0), requestAnimationFrame(n));
      };
    return (
      window.addEventListener("scroll", s, { passive: !0 }),
      window.addEventListener("resize", s),
      (i) => {
        (e.push(i), i());
      }
    );
  })(),
  H = (e, a, t = {}) => {
    if (!("IntersectionObserver" in window)) return (a(!0), null);
    let n = new IntersectionObserver((s) => s.forEach((i) => a(i.isIntersecting, i)), t);
    return (n.observe(e), n);
  };
function Le() {
  let e = c(".intro"),
    root = document.documentElement;
  if ((R.set("rubin-intro", 1, "session"), !e)) return;
  if (!root.classList.contains("has-intro")) {
    e.remove();
    return;
  }
  let logo = c(".intro-logo", e),
    bg = c(".intro-bg", e),
    gone = !1,
    finish = () => {
      (root.classList.add("intro-done"), e.remove());
    },
    exit = () => {
      if (gone) return;
      gone = !0;
      e.style.pointerEvents = "none";
      let brand = c(".site-header .brand"),
        D = 720,
        ez = "cubic-bezier(0.77, 0, 0.175, 1)",
        can = typeof e.animate == "function";
      if (!can) {
        finish();
        return;
      }
      bg && bg.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: D, easing: ez, fill: "forwards" });
      if (logo && brand && root.dataset.tone === "dark" && window.scrollY < 8) {
        let a = logo.getBoundingClientRect(),
          b = brand.getBoundingClientRect();
        logo.animate([{ transform: "none" }, { transform: `translate(${(b.left - a.left).toFixed(1)}px, ${(b.top - a.top).toFixed(1)}px) scale(${(b.width / a.width).toFixed(4)})` }], {
          duration: D,
          easing: ez,
          fill: "forwards",
        }).onfinish = finish;
      } else logo && logo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: "ease-out", fill: "forwards" });
      setTimeout(() => {
        e.isConnected && finish();
      }, D + 80);
    },
    start = () => {
      let t0 = window.__introT || performance.now();
      setTimeout(exit, Math.max(0, 1780 - (performance.now() - t0)));
    };
  (logo && !logo.complete ? (logo.addEventListener("load", start, { once: !0 }), logo.addEventListener("error", exit, { once: !0 })) : start(),
    e.addEventListener("click", exit),
    setTimeout(() => {
      e.isConnected && finish();
    }, 5400));
}
function xe() {
  let e = c("[data-header]");
  if (e) {
    let n = window.scrollY,
      s = c(".header-progress i", e);
    (J(() => {
      let i = window.scrollY;
      e.classList.toggle("is-solid", i > 24);
      let o = e.contains(document.activeElement) || v(".nav-drop[open]", e).length;
      if ((i > 560 && i > n + 3 && !o ? e.classList.add("is-hidden") : (i < n - 3 || i <= 560) && e.classList.remove("is-hidden"), (n = i), s)) {
        let r = document.documentElement.scrollHeight - window.innerHeight;
        s.style.transform = `scaleX(${r > 0 ? z(i / r, 0, 1).toFixed(4) : 0})`;
      }
    }),
      e.addEventListener("focusin", () => e.classList.remove("is-hidden")));
  }
  let a = v(".nav-drop");
  (document.addEventListener("click", (n) =>
    a.forEach((s) => {
      s.contains(n.target) || (s.open = !1);
    }),
  ),
    document.addEventListener("keydown", (n) => {
      n.key === "Escape" &&
        a.forEach((s) => {
          s.open && ((s.open = !1), s.querySelector("summary").focus());
        });
    }),
    a.forEach((n) =>
      n.addEventListener("toggle", () => {
        n.open &&
          a.forEach((s) => {
            s !== n && (s.open = !1);
          });
      }),
    ));
  let t = (n) => {
    if (!n.open || n.classList.contains("is-closing")) return;
    if ($) {
      n.close();
      return;
    }
    n.classList.add("is-closing");
    let s = !1,
      i = () => {
        s || ((s = !0), n.classList.remove("is-closing"), n.close());
      };
    (n.addEventListener("animationend", i, { once: !0 }), setTimeout(i, 520));
  };
  (v("[data-open]").forEach((n) =>
    n.addEventListener("click", () => {
      let s = document.getElementById(n.dataset.open);
      if (!s) return;
      let i = n.getBoundingClientRect();
      (s.style.setProperty("--ox", `${Math.round(i.left + i.width / 2)}px`),
        s.style.setProperty("--oy", `${Math.round(i.top + i.height / 2)}px`),
        typeof s.showModal == "function" ? (s.showModal(), document.documentElement.classList.add("has-dialog")) : s.setAttribute("open", ""));
    }),
  ),
    v("dialog.sheet").forEach((n) => {
      (n.addEventListener("close", () => document.documentElement.classList.remove("has-dialog")),
        n.addEventListener("cancel", (s) => {
          (s.preventDefault(), t(n));
        }),
        n.addEventListener("click", (s) => {
          s.target === n && t(n);
        }),
        v("[data-close]", n).forEach((s) => s.addEventListener("click", () => t(n))),
        v("a", n).forEach((s) =>
          s.addEventListener("click", () => {
            s.href.startsWith("tel:") || n.close();
          }),
        ));
    }));
  // Blatt von unten (Handy): am Kopf greifen und nach unten ziehen. Das Blatt folgt dem Finger, nach oben
  // gibt es nur zäh nach, und beim Loslassen entscheidet der Schwung, ob es schließt oder zurückfedert.
  v("dialog.sheet-small").forEach((n) => {
    let top = c(".sheet-top", n),
      drag = null;
    if (!top) return;
    top.addEventListener("pointerdown", (ev) => {
      if (drag || !oe("(max-width: 699px)") || ev.target.closest("button, a")) return;
      let now = performance.now();
      drag = { y: ev.clientY, dy: 0, v: 0, ly: ev.clientY, lt: now };
      try {
        top.setPointerCapture(ev.pointerId);
      } catch {}
    });
    top.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      let now = performance.now(),
        dy = ev.clientY - drag.y;
      ((drag.v = (ev.clientY - drag.ly) / Math.max(8, now - drag.lt)), (drag.ly = ev.clientY), (drag.lt = now), (drag.dy = dy));
      n.style.transform = `translateY(${(dy > 0 ? dy : dy / (1 - dy / 50)).toFixed(1)}px)`;
    });
    let end = () => {
      if (!drag) return;
      let d = drag,
        h = n.offsetHeight,
        vel = performance.now() - d.lt > 90 ? 0 : d.v,
        shut = d.dy > 0 && (vel > 0.45 || (d.dy > h * 0.35 && vel > -0.2)),
        from = n.style.transform || "none";
      drag = null;
      if ($ || typeof n.animate != "function") {
        ((n.style.transform = ""), shut && n.close());
        return;
      }
      if (shut) {
        let dur = z(Math.max(40, h - d.dy) / Math.max(vel, 0.9), 140, 320);
        ((n.animate([{ transform: from }, { transform: "translateY(105%)" }], { duration: dur, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).onfinish = () => {
          ((n.style.transform = ""), n.close());
        }),
          (n.style.transform = "translateY(105%)"));
      } else (n.animate([{ transform: from }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(0.32, 0.72, 0, 1)" }), (n.style.transform = ""));
    };
    (top.addEventListener("pointerup", end), top.addEventListener("pointercancel", end));
  });
}
function $e() {
  let e = c(".action-bar"),
    a = c(".to-top"),
    t = !1,
    n = !1,
    s = c(".site-footer"),
    i = () => window.scrollY < (c(".hero") ? window.innerHeight * 0.7 : 200) || t || n,
    o = c("form[data-steps]");
  o &&
    H(o, (h) => {
      ((n = h), e && e.classList.toggle("is-hidden", i()));
    });
  let r = !1,
    d = () => {
      a && (a.classList.toggle("at-end", r), a.classList.toggle("in-footer", t && !r));
    };
  s &&
    H(s, (h) => {
      ((t = h), e && e.classList.toggle("is-hidden", i()), d());
    });
  let l = c(".footer-bottom") || s;
  l &&
    H(l, (h) => {
      ((r = h), d());
    });
  let f = a ? c(".bar", a) : null;
  (J(() => {
    if ((e && e.classList.toggle("is-hidden", i()), a)) {
      let h = window.scrollY,
        u = document.documentElement.scrollHeight - window.innerHeight;
      (a.classList.toggle("is-on", h > window.innerHeight * 1.2), f && (f.style.strokeDashoffset = (151 * (1 - (u > 0 ? z(h / u, 0, 1) : 0))).toFixed(1)));
    }
  }),
    a?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: $ ? "auto" : "smooth" })));
}
function W() {
  let e = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    }).formatToParts(new Date()),
    a = (n) => e.find((s) => s.type === n)?.value,
    t = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 }[a("weekday").replace(".", "")];
  return { y: +a("year"), m: +a("month"), d: +a("day"), h: +a("hour"), min: +a("minute"), wd: t };
}
function Ce(e) {
  let a = e % 19,
    t = Math.floor(e / 100),
    n = e % 100,
    s = Math.floor(t / 4),
    i = t % 4,
    o = Math.floor((t + 8) / 25),
    r = Math.floor((t - o + 1) / 3),
    d = (19 * a + t - s - r + 15) % 30,
    l = Math.floor(n / 4),
    f = n % 4,
    h = (32 + 2 * i + 2 * l - d - f) % 7,
    u = Math.floor((a + 11 * d + 22 * h) / 451),
    g = Math.floor((d + h - 7 * u + 114) / 31),
    b = ((d + h - 7 * u + 114) % 31) + 1;
  return new Date(Date.UTC(e, g - 1, b));
}
function re(e) {
  let a = Ce(e),
    t = (n) => {
      let s = new Date(a);
      return (s.setUTCDate(s.getUTCDate() + n), `${s.getUTCMonth() + 1}-${s.getUTCDate()}`);
    };
  return new Set(["1-1", "5-1", "10-3", "10-31", "12-25", "12-26", t(-2), t(1), t(39), t(50)]);
}
var X = (e) => {
    let [a, t] = e.split(":").map(Number);
    return a * 60 + t;
  },
  ee = (e) => e.replace(/^0/, "").replace(/:00$/, ""),
  ke = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
function we(e, a) {
  let t = re(a.y),
    n = (r) => t.has(`${r.getUTCMonth() + 1}-${r.getUTCDate()}`),
    s = new Date(Date.UTC(a.y, a.m - 1, a.d)),
    i = a.h * 60 + a.min,
    o = e.hours[a.wd];
  if (o && !n(s)) {
    if (i >= X(o[0]) && i < X(o[1])) return { open: !0, text: `Ge\xF6ffnet bis ${ee(o[1])} Uhr` };
    if (i < X(o[0])) return { open: !1, text: `\xD6ffnet heute ${ee(o[0])} Uhr` };
  }
  for (let r = 1; r <= 7; r++) {
    let d = new Date(s);
    d.setUTCDate(d.getUTCDate() + r);
    let l = e.hours[d.getUTCDay()];
    if (l && !n(d))
      return {
        open: !1,
        text: `${o && n(s) ? "Feiertag, " : ""}${o && n(s) ? "\xF6ffnet" : "\xD6ffnet"} ${r === 1 ? "morgen" : ke[d.getUTCDay()]} ${ee(l[0])} Uhr`,
      };
  }
  return { open: !1, text: "Geschlossen" };
}
window.RUBIN_STATUS = (e) => {
  let a = (M.stores || []).find((t) => t.id === e);
  return a ? we(a, W()) : null;
};
function Te() {
  let e = M.stores || [];
  if (!e.length) return;
  let a = () => {
    let t = W();
    (e.forEach((n) => {
      let s = we(n, t);
      v(`[data-status="${n.id}"]`).forEach((i) => {
        ((i.textContent = s.text), i.classList.toggle("is-open", s.open), i.classList.toggle("is-closed", !s.open));
      });
    }),
      v(".timeline").forEach((n) => {
        v(".row", n).forEach((o) => o.classList.toggle("is-today", +o.dataset.wd === t.wd));
        let s = c(`.row[data-wd="${t.wd}"] .track`, n);
        v(".now", n).forEach((o) => o.remove());
        let i = t.h * 60 + t.min;
        if (s && i >= 480 && i <= 1260) {
          let o = document.createElement("span");
          ((o.className = "now"), (o.style.left = `${((i - 480) / 780) * 100}%`), (o.title = "Jetzt"), s.appendChild(o));
        }
      }));
  };
  (a(), setInterval(a, 6e4));
}
function De(e) {
  if (e.dataset.splitDone) return;
  e.dataset.splitDone = "1";
  let a = 0,
    t = (n) => {
      [...n.childNodes].forEach((s) => {
        if (s.nodeType === 3) {
          let i = s.textContent.split(/(\s+)/);
          if (i.every((r) => !r.trim())) return;
          let o = document.createDocumentFragment();
          (i.forEach((r) => {
            if (!r) return;
            if (!r.trim()) {
              o.appendChild(document.createTextNode(r));
              return;
            }
            let d = document.createElement("span");
            d.className = "w";
            let l = document.createElement("span");
            ((l.textContent = r), l.style.setProperty("--i", a++), d.appendChild(l), o.appendChild(d));
          }),
            s.replaceWith(o));
        } else s.nodeType === 1 && !s.classList.contains("w") && s.tagName !== "BR" && t(s);
      });
    };
  t(e);
}
function Fe() {
  (v("[data-split]").forEach(De), v("[data-stagger]").forEach((t) => [...t.children].forEach((n, s) => n.style.setProperty("--i", Math.min(s, 10)))));
  let e = v("[data-reveal], [data-stagger], [data-seals], [data-split]:not([data-reveal] [data-split]), .footer-stores, .hero-map, .voices-score");
  if (!e.length) return;
  if (!("IntersectionObserver" in window) || $) {
    e.forEach((t) => t.classList.add("is-in"));
    return;
  }
  v("[data-reveal]").forEach((t) => {
    let s = [...t.parentElement.children].filter((i) => i.hasAttribute("data-reveal")).indexOf(t);
    s > 0 && !t.style.getPropertyValue("--d") && t.style.setProperty("--d", `${Math.min(s, 6) * 0.07}s`);
  });
  let a = new IntersectionObserver(
    (t) =>
      t.forEach((n) => {
        n.isIntersecting && (n.target.classList.add("is-in"), a.unobserve(n.target));
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
  );
  e.forEach((t) => a.observe(t));
}
function Me() {
  if ($) return;
  let e = [];
  (v("[data-parallax]").forEach((o) => e.push({ el: o, kind: "parallax", k: parseFloat(o.dataset.parallax) || 0.1, ref: o.parentElement })),
    v("[data-drift]").forEach((o) => e.push({ el: o, kind: "drift", k: parseFloat(o.dataset.drift) || 0.1, ref: o.parentElement })));
  let a = new Set();
  if ("IntersectionObserver" in window) {
    let o = new IntersectionObserver(
      (r) =>
        r.forEach((d) => {
          let l = e.find((f) => f.ref === d.target || f.el === d.target);
          l && (d.isIntersecting ? a.add(l) : a.delete(l));
        }),
      { rootMargin: "25% 0px" },
    );
    e.forEach((r) => o.observe(r.ref));
  } else e.forEach((o) => a.add(o));
  let t = c(".hero"),
    n = t && c(".hero-inner", t),
    s = t && c(".hero-stage", t),
    i = t && c(".hero-foot", t);
  J(() => {
    let o = window.innerHeight;
    if (
      (a.forEach(({ el: r, kind: d, k: l, ref: f }) => {
        let h = f.getBoundingClientRect(),
          u = h.top + h.height / 2 - o / 2;
        d === "parallax"
          ? (r.style.transform = `translate3d(0, ${(-u * l).toFixed(1)}px, 0)`)
          : (r.style.transform = `translate3d(${(-u * l).toFixed(1)}px, 0, 0)`);
      }),
      t && n)
    ) {
      let r = t.offsetHeight || o,
        d = window.scrollY;
      if (d < r * 1.1) {
        let l = z(d / r, 0, 1);
        ((n.style.transform = `translate3d(0, ${(-l * o * 0.12).toFixed(1)}px, 0)`),
          (n.style.opacity = (1 - l * 1.25).toFixed(3)),
          i && (i.style.opacity = (1 - l * 1.6).toFixed(3)),
          s && ((s.style.translate = `0 ${(l * o * 0.16).toFixed(1)}px`), (s.style.scale = (1 + l * 0.12).toFixed(4))));
      }
    }
  });
}
function Se() {
  $ || v(".voices, .gold-band, .rmap").forEach((e) => H(e, (a) => e.classList.toggle("is-playing", a), { rootMargin: "10% 0px" }));
}
function Ae() {
  v("[data-ticker]").forEach((e) => {
    let a = c(".ticker-track", e);
    if (!a || $) return;
    let t = 0,
      n = 0,
      s = !1,
      i = 0,
      o = 0,
      r = 1,
      d = () => {
        n = a.scrollWidth / 2;
      };
    (d(), window.addEventListener("resize", d));
    let l = (f) => {
      if (((i = 0), !s)) return;
      let h = Math.min(48, f - (o || f));
      o = f;
      let u = V.v;
      Math.abs(u) > 0.5 && (r = u > 0 ? 1 : -1);
      let g = 0.045 + Math.min(1.4, Math.abs(u) * 0.05);
      ((t -= r * g * h),
        n && (t <= -n && (t += n), t > 0 && (t -= n)),
        (a.style.transform = `translate3d(${t.toFixed(2)}px, 0, 0)`),
        (i = requestAnimationFrame(l)));
    };
    H(e, (f) => {
      ((s = f), f && !i && ((o = 0), (i = requestAnimationFrame(l))));
    });
  });
}
function Ie() {
  v("[data-rail]").forEach((e) => {
    let a = e.closest("section"),
      t = c("[data-rail-prev]", a),
      n = c("[data-rail-next]", a),
      s = c(".rail-bar i", a),
      i = () => {
        let k = e.children;
        return k.length > 1 ? k[1].offsetLeft - k[0].offsetLeft : k[0] ? k[0].getBoundingClientRect().width + 20 : 300;
      },
      o = () => {
        let m = e.scrollWidth - e.clientWidth;
        if ((t && (t.disabled = e.scrollLeft < 8), n && (n.disabled = e.scrollLeft >= m - 8), s)) {
          let w = z(e.clientWidth / e.scrollWidth, 0.08, 1),
            k = m > 0 ? e.scrollLeft / m : 0;
          ((s.style.transform = `translateX(${(((k * (1 - w)) / w) * 100).toFixed(2)}%) scaleX(${w.toFixed(3)})`), (s.style.transformOrigin = "left"));
        }
      };
    if (
      (t?.addEventListener("click", () => e.scrollBy({ left: -i() * 2, behavior: $ ? "auto" : "smooth" })),
      n?.addEventListener("click", () => e.scrollBy({ left: i() * 2, behavior: $ ? "auto" : "smooth" })),
      e.addEventListener("scroll", o, { passive: !0 }),
      window.addEventListener("resize", o),
      o(),
      !_)
    )
      return;
    let r = !1,
      d = 0,
      l = 0,
      f = 0,
      h = 0,
      u = 0,
      g = 0,
      b = 0;
    (e.addEventListener("pointerdown", (m) => {
      m.pointerType !== "mouse" ||
        m.button !== 0 ||
        ((r = !0), (d = 0), (l = m.clientX), (f = e.scrollLeft), (u = m.clientX), (g = performance.now()), (h = 0), cancelAnimationFrame(b));
    }),
      window.addEventListener("pointermove", (m) => {
        if (!r) return;
        let w = m.clientX - l;
        ((d = Math.max(d, Math.abs(w))), d > 6 && (e.classList.add("is-dragging"), (e.scrollLeft = f - w)));
        let k = performance.now();
        ((h = (m.clientX - u) / Math.max(8, k - g)), (u = m.clientX), (g = k));
      }),
      window.addEventListener("pointerup", () => {
        if (!r) return;
        if (((r = !1), d <= 6)) {
          e.classList.remove("is-dragging");
          return;
        }
        // Schwung: Aus der Geschwindigkeit beim Loslassen wird der Ruhepunkt vorausberechnet, dort rastet
        // die nächste Karte ein. Eine kritisch gedämpfte Feder übernimmt die Geschwindigkeit ohne Ruck.
        let vel = performance.now() - g < 90 ? -h * 1000 : 0,
          max = e.scrollWidth - e.clientWidth,
          step = i(),
          target = z(Math.round((e.scrollLeft + vel * 0.499) / step) * step, 0, max),
          st = { x: e.scrollLeft, v: vel },
          last = performance.now(),
          w = (now) => {
            let dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            let om = 9,
              ex = Math.exp(-om * dt),
              dd = st.x - target,
              tmp = (st.v + om * dd) * dt;
            ((st.x = target + (dd + tmp) * ex), (st.v = (st.v - om * tmp) * ex));
            if ($ || (Math.abs(st.x - target) < 0.5 && Math.abs(st.v) < 8)) {
              ((e.scrollLeft = target), e.classList.remove("is-dragging"));
              return;
            }
            ((e.scrollLeft = st.x), (b = requestAnimationFrame(w)));
          };
        b = requestAnimationFrame(w);
      }),
      e.addEventListener(
        "click",
        (m) => {
          d > 6 && (m.preventDefault(), m.stopPropagation());
        },
        !0,
      ));
  });
}
function Re() {
  if (!_) return;
  let e = 2.1,
    a = 75;
  v("[data-loupe]").forEach((t) => {
    let n = c("img", t);
    if (!n) return;
    let s = null,
      i = (o) => {
        let r = n.getBoundingClientRect(),
          d = t.getBoundingClientRect(),
          l = o.clientX - r.left,
          f = o.clientY - r.top;
        ((s.style.left = `${o.clientX - d.left}px`),
          (s.style.top = `${o.clientY - d.top}px`),
          (s.style.backgroundSize = `${r.width * e}px ${r.height * e}px`),
          (s.style.backgroundPosition = `${a - l * e}px ${a - f * e}px`));
      };
    (t.addEventListener("pointerenter", (o) => {
      o.pointerType === "mouse" &&
        (s || ((s = document.createElement("span")), (s.className = "loupe"), s.setAttribute("aria-hidden", "true"), t.appendChild(s)),
        (s.style.backgroundImage = `url("${(n.currentSrc || n.src).replace(/-360\.(avif|webp)/, "-600.$1")}")`),
        i(o),
        requestAnimationFrame(() => s.classList.add("is-on")));
    }),
      t.addEventListener("pointermove", (o) => {
        s && o.pointerType === "mouse" && i(o);
      }),
      t.addEventListener("pointerleave", () => {
        s && s.classList.remove("is-on");
      }));
  });
}
function Ue() {
  !_ ||
    $ ||
    v("[data-tilt]").forEach((e) => {
      let a = parseFloat(e.dataset.tilt) || 5;
      e.classList.add("tilt");
      let t = document.createElement("span");
      ((t.className = "sheen"), t.setAttribute("aria-hidden", "true"), e.appendChild(t));
      let n = 0,
        s = 0,
        i = 0,
        o = 0,
        r = 0,
        d = !1,
        l = () => {
          ((i = q(i, n, 0.14)),
            (o = q(o, s, 0.14)),
            (e.style.transform = `perspective(1000px) rotateX(${i.toFixed(2)}deg) rotateY(${o.toFixed(2)}deg)`),
            d || Math.abs(i - n) > 0.01 || Math.abs(o - s) > 0.01 ? (r = requestAnimationFrame(l)) : (r = 0));
        };
      (e.addEventListener("pointerenter", (f) => {
        f.pointerType === "mouse" && ((d = !0), e.classList.add("is-tilting"), r || (r = requestAnimationFrame(l)));
      }),
        e.addEventListener("pointermove", (f) => {
          if (!d) return;
          let h = e.getBoundingClientRect(),
            u = (f.clientX - h.left) / h.width,
            g = (f.clientY - h.top) / h.height;
          ((s = (u - 0.5) * 2 * a),
            (n = -(g - 0.5) * 2 * a * 0.8),
            t.style.setProperty("--mx", `${(u * 100).toFixed(1)}%`),
            t.style.setProperty("--my", `${(g * 100).toFixed(1)}%`));
        }),
        e.addEventListener("pointerleave", () => {
          ((d = !1), (n = s = 0), e.classList.remove("is-tilting"), cancelAnimationFrame(r), (r = 0), (e.style.transform = ""), (i = o = 0));
        }));
    });
}
function ze() {
  !_ ||
    $ ||
    v("[data-magnetic], .hero .btn-ruby, .cta-block .btn, .header-cta, .rail-btn, .to-top").forEach((e) => {
      (e.addEventListener("pointermove", (n) => {
        if (n.pointerType !== "mouse") return;
        let s = e.getBoundingClientRect(),
          i = z((n.clientX - (s.left + s.width / 2)) * 0.28, -8, 8),
          o = z((n.clientY - (s.top + s.height / 2)) * 0.28, -8, 8);
        e.style.translate = `${i.toFixed(1)}px ${o.toFixed(1)}px`;
      }),
        e.addEventListener("pointerleave", () => {
          e.style.translate = "";
        }));
    });
}
function Be() {
  if (!_ || $) return;
  let e = document.createElement("div");
  ((e.className = "cursor"), e.setAttribute("aria-hidden", "true"), (e.innerHTML = "<b></b>"), document.body.appendChild(e));
  let a = c("b", e),
    t = -100,
    n = -100,
    s = -100,
    i = -100,
    o = 0,
    r = !1,
    d = () => {
      ((s = q(s, t, 0.24)),
        (i = q(i, n, 0.24)),
        (e.style.transform = `translate3d(${s.toFixed(1)}px, ${i.toFixed(1)}px, 0)`),
        (o = Math.abs(s - t) + Math.abs(i - n) > 0.3 ? requestAnimationFrame(d) : 0));
    },
    l = (f) => {
      let h = f.closest("[data-cursor]");
      if (h) {
        ((a.textContent = h.dataset.cursor), (e.className = "cursor is-on is-label"));
        return;
      }
      if (f.closest("input, textarea, select, [contenteditable]")) {
        e.className = "cursor is-on is-text";
        return;
      }
      if (f.closest('a, button, summary, label, [role="button"]')) {
        e.className = "cursor is-on is-link";
        return;
      }
      e.className = "cursor is-on";
    };
  (window.addEventListener(
    "pointermove",
    (f) => {
      f.pointerType === "mouse" && ((t = f.clientX), (n = f.clientY), r || ((r = !0), (s = t), (i = n)), l(f.target), o || (o = requestAnimationFrame(d)));
    },
    { passive: !0 },
  ),
    document.addEventListener("pointerleave", () => {
      ((e.className = "cursor"), (r = !1));
    }),
    window.addEventListener("blur", () => {
      e.className = "cursor";
    }));
}
function Ne() {
  v("[data-count]").forEach((e) => {
    let a = parseFloat(e.dataset.count),
      t = +(e.dataset.decimals || 0),
      n = (o) => o.toLocaleString("de-DE", { minimumFractionDigits: t, maximumFractionDigits: t });
    if ($ || !("IntersectionObserver" in window)) {
      e.textContent = n(a);
      return;
    }
    e.textContent = n(0);
    let s = !1,
      i = H(
        e,
        (o) => {
          if (!o || s) return;
          ((s = !0), i && i.disconnect());
          let r = performance.now(),
            d = 1800,
            l = (f) => {
              let h = z((f - r) / d, 0, 1),
                u = 1 - Math.pow(2, -10 * h);
              ((e.textContent = n(h >= 1 ? a : a * u)), h < 1 && requestAnimationFrame(l));
            };
          requestAnimationFrame(l);
        },
        { threshold: 0.4 },
      );
  });
}
function He() {
  $ ||
    v(".acc details").forEach((e) => {
      let a = c("summary", e),
        t = c(".answer", e);
      if (!a || !t || !t.animate) return;
      let n = null;
      a.addEventListener("click", (s) => {
        if ((s.preventDefault(), n && n.cancel(), e.open)) {
          let i = t.scrollHeight;
          ((n = t.animate(
            [
              { height: `${i}px`, opacity: 1 },
              { height: "0px", opacity: 0 },
            ],
            { duration: 300, easing: "cubic-bezier(.77,0,.175,1)" },
          )),
            (n.onfinish = () => {
              ((e.open = !1), (n = null));
            }));
        } else {
          e.open = !0;
          let i = t.scrollHeight;
          ((n = t.animate(
            [
              { height: "0px", opacity: 0 },
              { height: `${i}px`, opacity: 1 },
            ],
            { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" },
          )),
            (n.onfinish = () => {
              n = null;
            }));
        }
      });
    });
}
var se = "rubin-studio";
function j(e, a, t) {
  let n = e.elements[a];
  if (!n) return !1;
  if (n.tagName === "SELECT") {
    let o = [...n.options].find((r) => t({ value: r.value, dataset: r.dataset }));
    return o ? ((n.value = o.value), !0) : !1;
  }
  let i = (n.length !== void 0 ? [...n] : [n]).find(t);
  return i ? ((i.checked = !0), i.dispatchEvent(new Event("change", { bubbles: !0 })), !0) : !1;
}
function ve(e) {
  let a = new URLSearchParams(location.search),
    t = a.get("anlass") || "";
  if (!t && location.hash.startsWith("#anlass-"))
    try {
      t = decodeURIComponent(location.hash.slice(8));
    } catch {}
  t && j(e, "anlass", (s) => s.value.toLowerCase().startsWith(t.toLowerCase()) || t.toLowerCase().startsWith(s.value.toLowerCase()));
  let n = a.get("filiale") || (location.hash.startsWith("#filiale-") ? location.hash.slice(9) : "");
  n && j(e, "filiale", (s) => s.dataset.id === n);
}
var Pe = (e) =>
  [2, 3, 4, 5, 11, 12, 13, 14].includes(e) ? "Verlobungsring" : (e >= 27 && e <= 37) || e === 22 || e === 26 ? "Trauringberatung" : "Schmuckberatung";
function Oe(e) {
  let a = new URLSearchParams(location.search).get("url");
  if (!a) return !1;
  let t;
  try {
    t = new URL(a, location.href);
  } catch {
    return !1;
  }
  let n = t.origin === location.origin && t.hash.match(/^#\/([a-z]{1,5}-[a-z0-9]+(?:-[a-z0-9]+)*)\/[\w-]+$/i);
  if (!n) return !1;
  let s = n[1].toUpperCase(),
    i = parseInt(t.searchParams.get("rubinCatalog"), 10) || (/^#k\d+/.test(t.hash) ? parseInt(t.hash.slice(2), 10) : 27);
  (j(e, "anlass", (r) => r.value === Pe(i)),
    e.elements.nachricht &&
      !e.elements.nachricht.value &&
      (e.elements.nachricht.value = `Ich interessiere mich f\xFCr das Modell ${s} aus Ihrem Katalog:
${t.href}`));
  let o = c(".prefill", e);
  if (o) {
    c(".prefill-title", o).textContent = "Ihr Modell aus dem Katalog";
    let r = document.createElement("a");
    ((r.className = "link"),
      (r.href = t.href),
      (r.target = "_blank"),
      (r.rel = "noopener"),
      (r.textContent = "im Katalog ansehen"),
      c(".prefill-text", o).replaceChildren(document.createTextNode(`${s} \xB7 `), r),
      (o.hidden = !1));
  }
  return !0;
}
var G = (e) => String(e).padStart(2, "0"),
  Y = (e) => `${e.getUTCFullYear()}-${G(e.getUTCMonth() + 1)}-${G(e.getUTCDate())}`;
function P(e) {
  let a = e.querySelector('input[name="filiale"]:checked'),
    t = a ? (M.stores || []).find((r) => r.id === a.dataset.id) : null,
    n = e.elements.datum ? e.elements.datum.value : "";
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(n)) return { st: t, date: null };
  let s = new Date(`${n}T12:00:00Z`),
    i = s.getUTCDay(),
    o = re(s.getUTCFullYear()).has(`${s.getUTCMonth() + 1}-${s.getUTCDate()}`);
  return { st: t, date: s, wd: i, hours: o ? null : t.hours[i] || null, holiday: o };
}
function ie(e, a) {
  let t = W(),
    n = Y(new Date(Date.UTC(t.y, t.m - 1, t.d))),
    s = re(a.getUTCFullYear()).has(`${a.getUTCMonth() + 1}-${a.getUTCDate()}`),
    i = s ? null : e.hours[a.getUTCDay()];
  if (!i) return { closed: !0, holiday: s, slots: [] };
  let [o, r] = i.map(X),
    d = Y(a) === n ? t.h * 60 + t.min + 60 : 0,
    l = [];
  for (let f = o; f <= r - 30; f += 30) f >= d && l.push(`${G(Math.floor(f / 60))}:${G(f % 60)}`);
  return { closed: !1, hours: i, slots: l };
}
var K = (e, a = !1) => e.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", ...(a ? { year: "numeric" } : {}), timeZone: "UTC" });
function qe(e) {
  let a = e.elements.datum,
    t = e.elements.zeit,
    n = c("[data-when-hint]", e);
  if (!a || !t || t.tagName !== "SELECT") return;
  let s = W(),
    i = new Date(Date.UTC(s.y, s.m - 1, s.d)),
    o = new Date(i);
  (o.setUTCDate(o.getUTCDate() + 183), (a.min = Y(i)), (a.max = Y(o)));
  let r = [...t.options].slice(1).map((l) => l.value),
    d = () => {
      let l = P(e),
        f = t.value,
        h = r,
        u = "",
        g = !1;
      if (l.st && l.date) {
        let m = ie(l.st, l.date),
          w = K(l.date);
        ((h = m.slots),
          m.closed
            ? ((g = !0), (u = `${l.st.name}: am ${w} geschlossen${m.holiday ? " (Feiertag)" : ""}. Bitte w\xE4hlen Sie einen anderen Tag.`))
            : h.length
              ? (u = `${l.st.name}, ${w}: ge\xF6ffnet ${m.hours[0]} \u2013 ${m.hours[1]} Uhr.`)
              : ((g = !0), (u = `${l.st.name}: heute ist kein Termin mehr m\xF6glich. Bitte w\xE4hlen Sie einen anderen Tag.`)));
      } else l.st && (u = `${l.st.name}: ${l.st.hoursText}. Sonn- und feiertags geschlossen.`);
      ((t.innerHTML = '<option value="">Uhrzeit egal</option>' + h.map((m) => `<option${m === f ? " selected" : ""}>${m}</option>`).join("")),
        (t.disabled = g),
        n && ((n.textContent = u), n.classList.toggle("is-warn", g), (n.hidden = !u)));
      let b = a.closest(".field");
      b && b.classList.contains("has-error") && Z(b);
    };
  (e.addEventListener("change", (l) => {
    (l.target.name === "filiale" || l.target.name === "datum") && d();
  }),
    a.addEventListener("input", d),
    d());
}
var ye = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  Ye = ["Jan.", "Feb.", "M\xE4rz", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
function _e(e) {
  let a = c("[data-days]", e),
    t = e.elements.datum,
    n = e.elements.zeit;
  if (!a || !t || !n) return;
  let s = c("[data-days-strip]", a),
    i = c("[data-slots-wrap]", a),
    o = c("[data-slots]", a);
  ((a.hidden = !1), e.classList.add("has-days"));
  let r = W(),
    d = new Date(Date.UTC(r.y, r.m - 1, r.d)),
    l = 28,
    f = () => {
      let m = e.querySelector('input[name="filiale"]:checked');
      return m ? (M.stores || []).find((w) => w.id === m.dataset.id) : null;
    },
    h = () => {
      let m = f(),
        w = `<label class="day day-flex"><input type="radio" name="tag-pick" form="rubin-days" value=""${t.value ? "" : " checked"}><span class="day-box"><span class="day-wd">Termin</span><span class="day-num">offen</span><span class="day-mon">flexibel</span></span></label>`;
      for (let S = 0; S < l; S++) {
        let F = new Date(d);
        F.setUTCDate(F.getUTCDate() + S);
        let I = Y(F),
          x = m ? ie(m, F) : { closed: F.getUTCDay() === 0, slots: [1] },
          A = x.closed || !x.slots.length;
        w += `<label class="day${A ? " is-closed" : ""}${F.getUTCDay() === 1 ? " is-week" : ""}"><input type="radio" name="tag-pick" form="rubin-days" value="${I}"${A ? " disabled" : ""}${I === t.value ? " checked" : ""} aria-label="${K(F)}${A ? ", geschlossen" : ""}"><span class="day-box" aria-hidden="true"><span class="day-wd">${S === 0 ? "Heute" : S === 1 ? "Morgen" : ye[F.getUTCDay()]}</span><span class="day-num">${F.getUTCDate()}</span><span class="day-mon">${A ? "zu" : Ye[F.getUTCMonth()]}</span></span></label>`;
      }
      s.innerHTML = w;
      let k = c("input:checked", s);
      k && k.value && k.closest(".day").scrollIntoView({ block: "nearest", inline: "center" });
    },
    u = () => {
      let m = [...n.options].slice(1).map((w) => w.value);
      if (!t.value || n.disabled || !m.length) {
        ((i.hidden = !0), (o.innerHTML = ""));
        return;
      }
      ((i.hidden = !1),
        (o.innerHTML =
          `<label class="slot slot-any"><input type="radio" name="zeit-pick" form="rubin-slots" value=""${n.value ? "" : " checked"}><span>Egal</span></label>` +
          m
            .map(
              (w) =>
                `<label class="slot"><input type="radio" name="zeit-pick" form="rubin-slots" value="${w}"${w === n.value ? " checked" : ""}><span>${w}</span></label>`,
            )
            .join("")));
    };
  (s.addEventListener("change", (m) => {
    ((t.value = m.target.value), m.target.value || (n.value = ""), t.dispatchEvent(new Event("change", { bubbles: !0 })));
  }),
    o.addEventListener("change", (m) => {
      ((n.value = m.target.value), n.dispatchEvent(new Event("change", { bubbles: !0 })));
    }),
    e.addEventListener("change", (m) => {
      if (m.target.name === "filiale") {
        let w = f();
        if (w && t.value) {
          let k = ie(w, new Date(`${t.value}T12:00:00Z`));
          (k.closed || !k.slots.length) && ((t.value = ""), (n.value = ""), t.dispatchEvent(new Event("change", { bubbles: !0 })));
        }
        h();
      }
      if ((m.target.name === "filiale" || m.target.name === "datum") && (u(), m.target.name === "datum" && m.target === t)) {
        let w = c(`input[value="${t.value}"]`, s);
        if (w) w.checked = !0;
        else if (!t.value) {
          let k = c('input[value=""]', s);
          k && (k.checked = !0);
        }
      }
    }));
  let g = c("[data-days-other]", a);
  g?.addEventListener("click", () => {
    let m = e.classList.toggle("show-native");
    (g.setAttribute("aria-expanded", String(m)), m && t.focus());
  });
  let b = (m) => s.scrollBy({ left: m * s.clientWidth * 0.85, behavior: $ ? "auto" : "smooth" });
  (c("[data-days-prev]", a)?.addEventListener("click", () => b(-1)), c("[data-days-next]", a)?.addEventListener("click", () => b(1)), h(), u());
}
function We(e) {
  if (!e.hasAttribute("data-steps")) return;
  let a = c(".steps-viewport", e),
    t = v(":scope > [data-step]", a),
    n = t.length,
    s = c(".step-nav", e),
    i = c("[data-prev]", s),
    o = c("[data-next]", s),
    r = c("[data-send]", s),
    d = c(".stepper", e),
    l = c(".stepper-bar i", d),
    f = ["Filiale", "Anlass", "Termin", "Kontakt", "Pr\xFCfen"];
  (e.classList.add("is-stepped"), (d.hidden = !1), (s.hidden = !1));
  let h = 0,
    u = 1,
    g = e.elements,
    b = (p) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p),
    m = (p) => {
      if (p === 1) return !!e.querySelector('input[name="filiale"]:checked');
      if (p === 2) return !!e.querySelector('input[name="anlass"]:checked');
      if (p === 3) {
        let E = P(e);
        return !E.date || !!E.hours;
      }
      return p === 4 ? !!g.name.value.trim() && b(g.email.value) && (!g.telefon.value || g.telefon.value.replace(/[^\d]/g, "").length >= 6) : !0;
    },
    w = (p) => p <= u || Array.from({ length: p - 1 }, (E, T) => m(T + 1)).every(Boolean),
    k = () => u === n && h < n - 1 && w(n),
    S = () => (k() ? n : h + 1),
    F = (p) => {
      let E = P(e);
      return p === 1
        ? e.querySelector('input[name="filiale"]:checked')?.dataset.short || ""
        : p === 2
          ? g.anlass.value || ""
          : p === 3
            ? E.date
              ? `${ye[E.date.getUTCDay()]} ${E.date.getUTCDate()}.${E.date.getUTCMonth() + 1}.${g.zeit.value ? `, ${g.zeit.value}` : ""}`
              : "offen"
            : p === 4
              ? g.name.value.trim()
              : "";
    },
    I = (p) => {
      let E = t[p - 1],
        T = [E, ...v(".field", E)].filter((C) => C.classList.contains("field")),
        y = null;
      return (
        T.forEach((C) => {
          !Z(C) && !y && (y = C);
        }),
        y ? ((y.dataset.group ? c("input", y) : c("input, select, textarea", y))?.focus(), !1) : !0
      );
    },
    x = () => {
      (v("[data-goto]", d).forEach((T) => {
        let y = +T.dataset.goto,
          C = T.parentElement;
        (C.classList.toggle("is-current", y === h),
          C.classList.toggle("is-done", y !== h && y < n && y <= u && m(y)),
          (T.disabled = y === h || !w(y)),
          y === h ? T.setAttribute("aria-current", "step") : T.removeAttribute("aria-current"));
        let U = c("[data-val]", T);
        U && (U.textContent = y < n && y <= u && y !== h && m(y) ? F(y) : "");
      }),
        l && (l.style.transform = `scaleX(${(h / n).toFixed(3)})`),
        h < n && (c("span", o).textContent = k() ? "Zur \xDCbersicht" : h === n - 1 ? "Pr\xFCfen" : "Weiter"));
      let p = c("[data-step-count]", d),
        E = c("[data-step-name]", d);
      (p && (p.textContent = `Schritt ${h} von ${n}`), E && (E.textContent = f[h - 1]));
    },
    A = () => {
      let p = c("[data-review]", e);
      if (!p) return;
      let E = P(e),
        T = [
          [1, "Filiale", E.st ? E.st.name : ""],
          [2, "Anlass", g.anlass.value],
          [
            3,
            "Wunschtermin",
            E.date ? `${K(E.date, !0)}, ${g.zeit.value ? `${g.zeit.value} Uhr` : "Uhrzeit egal"}` : "Offen \u2013 wir schlagen Ihnen einen Termin vor",
          ],
          [4, "Name", g.name.value.trim()],
          [4, "E-Mail", g.email.value.trim()],
          [4, "Telefon", g.telefon.value.trim() || "\u2013"],
          ...(g.nachricht.value.trim() ? [[4, "Nachricht", g.nachricht.value.trim()]] : []),
        ];
      ((p.innerHTML = ""),
        T.forEach(([y, C, U]) => {
          let Q = document.createElement("div");
          Q.className = "review-row";
          let me = document.createElement("dt");
          me.textContent = C;
          let pe = document.createElement("dd"),
            ge = document.createElement("span");
          ge.textContent = U;
          let N = document.createElement("button");
          ((N.type = "button"),
            (N.className = "review-edit"),
            (N.dataset.goto = y),
            (N.textContent = "\xC4ndern"),
            N.setAttribute("aria-label", `${C} \xE4ndern`),
            pe.append(ge, N),
            Q.append(me, pe),
            p.append(Q));
        }),
        (p.hidden = !1));
    },
    D = (p, { focus: E = !0 } = {}) => {
      if (p < 1 || p > n || p === h) return;
      let T = p > h ? 1 : -1,
        y = h ? a.offsetHeight : 0;
      if (
        ((h = p),
        (u = Math.max(u, p)),
        t.forEach((C, U) => {
          C.hidden = U + 1 !== p;
        }),
        p === n && A(),
        (i.hidden = p === 1),
        (o.hidden = p === n),
        r && (r.hidden = p !== n),
        e.classList.toggle("is-last", p === n),
        x(),
        y && !$)
      ) {
        let C = a.offsetHeight;
        if (a.animate && Math.abs(C - y) > 2) {
          a.style.overflow = "hidden";
          let U = a.animate([{ height: `${y}px` }, { height: `${C}px` }], { duration: 340, easing: "cubic-bezier(.23,1,.32,1)" });
          U.onfinish = U.oncancel = () => {
            a.style.overflow = "";
          };
        }
        t[p - 1].animate?.(
          [
            { opacity: 0, transform: `translateX(${T * 26}px)` },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, easing: "cubic-bezier(.23,1,.32,1)" },
        );
      }
      if (E) {
        let C = e.getBoundingClientRect().top,
          U = (c(".site-header")?.offsetHeight || parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 70) + 16;
        ((C < U || C > window.innerHeight * 0.55) && window.scrollTo({ top: window.scrollY + C - U, behavior: $ ? "auto" : "smooth" }),
          c(".step-title", t[p - 1])?.focus({ preventScroll: !0 }));
      }
    };
  (o.addEventListener("click", () => {
    I(h) && D(S());
  }),
    i.addEventListener("click", () => D(h - 1)),
    e.addEventListener("click", (p) => {
      let E = p.target.closest("[data-goto]");
      if (!E || E.disabled) return;
      let T = +E.dataset.goto;
      (T < h || w(T)) && D(T);
    }));
  let B = !1;
  (e.addEventListener(
    "pointerdown",
    () => {
      B = !0;
    },
    !0,
  ),
    e.addEventListener(
      "keydown",
      (p) => {
        ((B = !1), p.key === "Enter" && h < n && p.target.matches('input:not([type="radio"]):not([type="checkbox"])') && (p.preventDefault(), o.click()));
      },
      !0,
    ),
    e.addEventListener("change", (p) => {
      x();
      let E = h;
      B &&
        ((E === 1 && p.target.name === "filiale") || (E === 2 && p.target.name === "anlass")) &&
        setTimeout(() => {
          h === E && m(E) && D(S());
        }, 420);
    }),
    e.addEventListener("input", () => {
      h === 4 && x();
    }));
  let L = () => {
    let p = m(1) ? (m(2) ? 3 : 2) : 1;
    ((u = Math.max(u, p)), (h = 0), D(p, { focus: !1 }));
  };
  ((e._steps = { go: D, restart: L, current: () => h }), L());
}
function Ve() {
  (window.addEventListener("hashchange", () => {
    if (!/^#(anlass-|filiale-)/.test(location.hash)) return;
    let e = v('form[data-form="termin"]');
    e.length &&
      (e.forEach((a) => {
        (ve(a), a._steps?.restart());
      }),
      c("#termin")?.scrollIntoView({ block: "start" }));
  }),
    v("form[data-form]").forEach((e) => {
      (qe(e), _e(e));
      let a = R.get(se, "session");
      (a && e.dataset.form === "termin" && (location.hash === "#ring-studio" || e.dataset.prefill === "auto") && Ge(e, a), ve(e));
      let t = e.dataset.form === "termin" && Oe(e);
      (We(e),
        t && !location.hash && requestAnimationFrame(() => c("#termin")?.scrollIntoView({ block: "start" })),
        e.addEventListener("submit", async (s) => {
          if ((s.preventDefault(), !je(e))) return;
          let i = s.submitter && s.submitter.type === "submit" ? s.submitter : c("[data-send]:not([hidden])", e) || c('button[type="submit"]', e),
            o = i.innerHTML;
          ((i.disabled = !0), i.classList.add("is-busy"), (i.textContent = "Wird gesendet \u2026"));
          let r = c(".form-error-box", e);
          r && (r.hidden = !0);
          try {
            if (Ee) await new Promise((f) => setTimeout(f, 700));
            else {
              let f = await fetch(e.action, { method: "POST", body: new FormData(e), headers: { Accept: "application/json" } }),
                h = await f.json().catch(() => ({}));
              if (!f.ok || !h.ok) throw new Error(h.error || "send");
            }
            let d = c(".form-success", e.parentElement);
            (Xe(e, d), (e.hidden = !0), (d.hidden = !1), d.focus({ preventScroll: !0 }));
            let l = d.getBoundingClientRect().top;
            l < 80 && window.scrollTo({ top: window.scrollY + l - 110, behavior: $ ? "auto" : "smooth" });
            try {
              sessionStorage.removeItem(se);
            } catch {}
          } catch (d) {
            r &&
              ((r.hidden = !1),
              (r.textContent =
                d.message && d.message !== "send"
                  ? d.message
                  : "Die Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie uns an oder versuchen Sie es in ein paar Minuten noch einmal."));
          } finally {
            ((i.disabled = !1), i.classList.remove("is-busy"), (i.innerHTML = o));
          }
        }));
      let n = (s) => {
        let i = s.target.closest(".field");
        i && i.classList.contains("has-error") && Z(i);
      };
      (e.addEventListener("input", n), e.addEventListener("change", n));
    }));
}
function Xe(e, a) {
  let t = a && c("[data-summary]", a);
  if (!t) return;
  let n = e.elements,
    s = P(e),
    i = e.querySelector('input[name="filiale"]:checked'),
    o = [
      ["Filiale", s.st ? s.st.name : i ? i.value : ""],
      ["Anlass", n.anlass ? n.anlass.value : ""],
    ];
  (s.date && o.push(["Wunschtermin", `${K(s.date, !0)}${n.zeit && n.zeit.value ? `, ${n.zeit.value} Uhr` : ""}`]),
    (t.innerHTML = ""),
    o
      .filter((r) => r[1])
      .forEach(([r, d]) => {
        let l = document.createElement("dt");
        l.textContent = r;
        let f = document.createElement("dd");
        ((f.textContent = d), t.append(l, f));
      }),
    (t.hidden = !t.children.length));
}
function Z(e) {
  let a = "",
    t;
  if (e.dataset.group) ((t = c("input", e)), t && t.required && !c("input:checked", e) && (a = t.dataset.msg || "Bitte ausw\xE4hlen."));
  else {
    if (((t = c("input, select, textarea", e)), !t)) return !0;
    if (t.required && !t.value.trim()) a = t.dataset.msg || "Bitte ausf\xFCllen.";
    else if (t.type === "email" && t.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.value)) a = "Bitte eine g\xFCltige E-Mail-Adresse eingeben.";
    else if (t.type === "tel" && t.value && t.value.replace(/[^\d]/g, "").length < 6) a = "Bitte eine Telefonnummer mit Vorwahl eingeben.";
    else if (t.name === "datum" && t.value && t.form) {
      let o = P(t.form);
      o.st && o.date && !o.hours ? (a = t.dataset.msg) : t.min && t.value < t.min && (a = "Bitte ein Datum ab heute w\xE4hlen.");
    }
  }
  e.classList.toggle("has-error", !!a);
  let n = c(":scope > .error", e),
    s = `${t.id || t.name}-err`,
    i = e.dataset.group ? e : t;
  return (
    a
      ? (n || ((n = document.createElement("p")), (n.className = "error"), (n.id = s), e.appendChild(n)),
        (n.textContent = a),
        i.setAttribute("aria-invalid", "true"),
        i.setAttribute("aria-describedby", n.id))
      : n && (n.remove(), i.removeAttribute("aria-invalid"), i.removeAttribute("aria-describedby")),
    !a
  );
}
function je(e) {
  let a = v(".field", e),
    t = null;
  if (
    (a.forEach((i) => {
      !Z(i) && !t && (t = i);
    }),
    !t)
  )
    return !0;
  let n = t.closest("[data-step]");
  return (
    n && e._steps && e._steps.go(+n.dataset.step, { focus: !1 }),
    (t.dataset.group ? c("input", t) : c("input, select, textarea", t))?.focus({ preventScroll: !0 }),
    t.scrollIntoView({ block: "center", behavior: $ ? "auto" : "smooth" }),
    !1
  );
}
function Ge(e, a) {
  (e.elements.anlass && j(e, "anlass", (n) => n.value === "Trauringberatung"),
    e.elements.nachricht &&
      !e.elements.nachricht.value &&
      (e.elements.nachricht.value = `Meine Auswahl im Ring-Studio:
${a.summary}`));
  let t = c(".prefill", e);
  t && ((t.hidden = !1), (c(".prefill-text", t).textContent = a.summary.replace(/\n/g, " \xB7 ")));
}
var le = (e) => {
  $ || !e || (e.classList.remove("is-tick"), e.offsetWidth, e.classList.add("is-tick"));
};
function Je() {
  let e = c("[data-goldcalc]");
  if (!e) return;
  let a = c("#gc-gewicht", e),
    t = c("#gc-legierung", e),
    n = c("[data-out]", e),
    s = c("[data-note]", e),
    i = (o) => {
      let r = parseFloat(String(a.value).replace(",", ".")) || 0,
        d = parseFloat(t.value);
      ((n.textContent = `${(r * d).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g`),
        (s.textContent = r > 0 ? `${r.toLocaleString("de-DE")} g \xD7 ${(d * 1e3).toFixed(0)}/1000 Feingehalt` : "Gewicht eingeben"),
        o && le(n));
    };
  (a.addEventListener("input", () => i(!0)), t.addEventListener("change", () => i(!0)), i(!1));
}
function Ke() {
  v("[data-ringsize]").forEach((e) => {
    let a = c("select", e),
      t = c("[data-out]", e),
      n = c(".ring-gauge i", e),
      s = (i) => {
        let o = +a.value,
          r = o / Math.PI;
        ((t.textContent = `\xD8 ${r.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`),
          n && n.style.setProperty("--s", (0.55 + ((r - 14.6) / (23 - 14.6)) * 0.45).toFixed(3)),
          i && le(t));
      };
    (a.addEventListener("change", () => s(!0)), s(!1));
  });
}
function Ze() {
  let e = c("[data-catalog]");
  if (!e) return;
  let a = new URLSearchParams(location.search),
    t = parseInt(a.get("rubinCatalog"), 10);
  !t && /^#k\d+$/.test(location.hash) && (t = parseInt(location.hash.slice(2), 10));
  let n = M.catalogNames || {};
  ((!t || !n[t]) && (t = 27),
    v("[data-catalog-title]").forEach((d) => {
      d.textContent = n[t];
    }),
    (document.title = `${n[t]} \xB7 Katalog \xB7 Juwelier Rubin`));
  let s = c(".catalog-gate", e),
    i = c("#rubin-catalog-plugin"),
    o = !1,
    r = () => {
      if (O) {
        c("[data-preview-note]", e).hidden = !1;
        return;
      }
      if (o) return;
      ((o = !0),
        (s.hidden = !0),
        (window.rubinCatalog = {
          language: "de",
          catalog: { id: t, setId: !0, text: !0, price: !0, moreCatalogs: !0, showAll: !1, teaserBoxes: [] },
          details: { price: !0, configuratorLink: !1, appointmentLink: M.appointmentUrl },
        }));
      let d = M.catalogBase;
      if ("CSSLayerBlockRule" in window) {
        let l = document.createElement("style");
        ((l.textContent = `@import url("${d}/css/app.css") layer(katalog);`), document.head.appendChild(l));
      } else {
        let l = document.createElement("link");
        ((l.rel = "stylesheet"), (l.href = `${d}/css/app.css`), document.head.appendChild(l));
      }
      (["js/chunk-vendors.js", "js/app.js"].forEach((l) => {
        let f = document.createElement("script");
        ((f.src = `${d}/${l}`), (f.async = !1), document.body.appendChild(f));
      }),
        (i.hidden = !1),
        setTimeout(() => {
          i.firstElementChild || i.classList.add("is-failed");
        }, 15e3),
        Qe(i));
    };
  (c("[data-catalog-load]", e)?.addEventListener("click", () => {
    (R.set("rubin-catalog-ok", !0, c("#cat-remember", e)?.checked ? "local" : "session"), r());
  }),
    (R.get("rubin-catalog-ok") || R.get("rubin-catalog-ok", "session")) && !O && r());
}
function Qe(e) {
  let a = (l) => /^#\/[^/]+\/[^/]+/.test(l),
    t = () => (c(".site-header")?.offsetHeight || 70) + 12,
    n = () => {
      let l = e.getBoundingClientRect().top;
      (l < t() - 1 || l > window.innerHeight * 0.5) && window.scrollTo({ top: window.scrollY + l - t(), behavior: "auto" });
    },
    s = (l, f, h = 6e3) => {
      let u = Date.now(),
        g = () => {
          l() ? f(!0) : Date.now() - u > h ? f(!1) : setTimeout(g, 80);
        };
      g();
    },
    i = () => v("#rubin-catalog li", e).length,
    o = location.hash,
    r = null;
  e.addEventListener(
    "click",
    (l) => {
      l.target.closest("#rubin-catalog li a") && (r = { y: window.scrollY, count: i() });
    },
    !0,
  );
  let d = () => {
    if (location.hash === o) return;
    let l = o;
    if (((o = location.hash), a(location.hash))) {
      a(l) ||
        s(
          () => c('[role="tabpanel"]', e),
          (u) => u && n(),
          4e3,
        );
      return;
    }
    if (!r) return;
    let f = r;
    r = null;
    let h = () =>
      s(
        () => i() > 0,
        (u) => {
          if (!u) return;
          let g = c("#rubin-catalog .more-button", e),
            b = i();
          b < f.count && g
            ? (g.click(),
              s(
                () => i() > b,
                (m) => (m ? h() : window.scrollTo({ top: f.y, behavior: "auto" })),
              ))
            : window.scrollTo({ top: f.y, behavior: "auto" });
        },
      );
    h();
  };
  (window.addEventListener("hashchange", d),
    window.addEventListener("popstate", d),
    new MutationObserver(() => {
      (d(), v('a[href="#/"]:not([aria-label])', e).forEach((l) => l.setAttribute("aria-label", "Zur\xFCck zur \xDCbersicht")));
    }).observe(e, { childList: !0, subtree: !0 }),
    a(location.hash) &&
      s(
        () => c('[role="tabpanel"]', e),
        (l) => l && n(),
        8e3,
      ));
}
function ce() {
  try {
    let e = document.createElement("canvas");
    return !!(e.getContext("webgl2") || e.getContext("webgl"));
  } catch {
    return !1;
  }
}
var te = null;
async function de() {
  return (te || (te = import(M.ringModule)), te);
}
async function be() {
  try {
    await Promise.all([document.fonts.load('italic 400 92px "Fraunces"'), document.fonts.load('400 92px "Fraunces"'), document.fonts.load('600 40px "Instrument Sans"')]);
  } catch {}
}
var ue = (e) => Math.min(window.devicePixelRatio || 1, e),
  fe = (e) => requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add("is-live"))),
  he = (e, a, t = "200px") => {
    if (!("IntersectionObserver" in window)) return a();
    let n = new IntersectionObserver(
      (s) => {
        s.some((i) => i.isIntersecting) && (n.disconnect(), a());
      },
      { rootMargin: t },
    );
    n.observe(e);
  },
  et = (e, a = 700) => ("requestIdleCallback" in window ? requestIdleCallback(e, { timeout: a }) : setTimeout(e, 200)),
  tt = { gelbgold: "Gelbgold 585", rosegold: "Ros\xE9gold 585", weissgold: "Wei\xDFgold 585", platin: "Platin 950" };
function nt() {
  let e = c('[data-ring="hero"]');
  if (!e || !ce()) return;
  let a = c("canvas", e),
    t = e.closest("section"),
    n = c("[data-metal-label]", t),
    s = R.get("rubin-hero-metal"),
    i = (r) => {
      (v("[data-metal]", t).forEach((d) => d.setAttribute("aria-pressed", String(d.dataset.metal === r))), n && ((n.textContent = tt[r] || ""), le(n)));
    };
  s && i(s);
  let o = async () => {
    try {
      let { createRingViewer: r } = await de(),
        l = r(a, {
          mode: "pair",
          autoRotate: !0,
          interactive: !0,
          preserve: !0,
          fontFamily: '"Fraunces"',
          restPitch: 0.3,
          reflect: !0,
          state: { mode: "pair", metal: s || "gelbgold" },
          onReady: () => {
            ($ ? l.setView(0.6, 0.3, 1) : (l.setView(-0.15, 0.52, 0.86), l.frame({ yaw: 0.6, pitch: 0.3, zoom: 1, auto: !0 })), fe(e));
          },
        });
      (window.addEventListener("pageswap", () => l.renderNow()),
        v("[data-metal]", t).forEach((f) =>
          f.addEventListener("click", () => {
            (i(f.dataset.metal), l.set({ metal: f.dataset.metal }), R.set("rubin-hero-metal", f.dataset.metal));
          }),
        ));
    } catch (r) {
      console.warn("3D ring unavailable", r);
    }
  };
  he(e, () => et(o, 600));
}
// ---------- Ring-Studio und Ring-Baukasten ----------
var ALLOY = { gelbgold: "Gelbgold", weissgold: "Wei\xDFgold", rosegold: "Ros\xE9gold", rotgold: "Rotgold", platin: "Platin", bicolor: "Bicolor Gelb-/Wei\xDFgold" },
  PROFILE = { flach: "flach", bombiert: "bombiert", kante: "mit Kante" },
  FINISH = { poliert: "poliert", laengsmatt: "l\xE4ngsmatt", quermatt: "quermatt", eismatt: "eismatt", mitte: "Mitte poliert, Seiten matt" },
  STONE = { ohne: "ohne Stein", eins: "1 Brillant", drei: "3 Brillanten", fuenf: "5 Brillanten", memoire: "Halbmemoire" },
  SCRIPT = { kursiv: "Schreibschrift", klassisch: "klassisch", modern: "modern" },
  GRADE_NOTE = {
    333: "33,3 % Feingold (8 Karat): g\xFCnstiger, im Ton etwas heller.",
    585: "58,5 % Feingold (14 Karat): der Klassiker f\xFCr Trauringe.",
    750: "75 % Feingold (18 Karat): satter Farbton, sp\xFCrbar schwerer.",
    950: "95 % Platin: von Natur aus wei\xDF, sehr dicht und schwer.",
  },
  RING0 = { metal: "gelbgold", grade: "585", profile: "bombiert", width: 4, height: 1.8, finish: "poliert", stones: "eins", stoneSize: 1, engraving: "", script: "kursiv", size: "" },
  CFG_KEY = "rubin-studio-cfg",
  de1 = (n, d = 1) => Number(n).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
function studioDefaults() {
  return { v: 2, active: 0, rings: [{ ...RING0 }, { ...RING0, width: 5, stones: "ohne" }] };
}
function studioLoad() {
  let s = null;
  try {
    let h = location.hash.match(/[#&]c=([^&]+)/);
    h && (s = JSON.parse(decodeURIComponent(h[1])));
  } catch {}
  s || (s = R.get(CFG_KEY));
  let d = studioDefaults();
  if (!s || typeof s != "object") return d;
  if (s.v !== 2 || !Array.isArray(s.rings)) {
    // \xE4lteres Format: ein einzelner Ring
    let one = {};
    ["metal", "profile", "width", "finish", "stones", "engraving", "script", "size"].forEach((k) => s[k] != null && (one[k] = s[k]));
    return ((d.rings[0] = { ...RING0, ...one }), d);
  }
  let clean = (r, base) => {
    let o = { ...base };
    Object.keys(RING0).forEach((k) => r && r[k] != null && typeof r[k] != "object" && (o[k] = r[k]));
    return (
      ALLOY[o.metal] || (o.metal = base.metal),
      PROFILE[o.profile] || (o.profile = base.profile),
      FINISH[o.finish] || (o.finish = base.finish),
      STONE[o.stones] || (o.stones = base.stones),
      SCRIPT[o.script] || (o.script = base.script),
      ["333", "585", "750"].includes(String(o.grade)) || (o.grade = "585"),
      (o.grade = String(o.grade)),
      (o.width = z(+o.width || base.width, 2.5, 8)),
      (o.height = z(+o.height || base.height, 1.2, 2.6)),
      (o.stoneSize = z(+o.stoneSize || 1, 0.8, 1.25)),
      (o.engraving = String(o.engraving || "").slice(0, 30)),
      (o.size = /^(4[6-9]|[56]\d|7[0-2])$/.test(String(o.size)) ? String(o.size) : ""),
      o
    );
  };
  return { v: 2, active: s.active === 1 ? 1 : 0, rings: [clean(s.rings[0], d.rings[0]), clean(s.rings[1], d.rings[1])] };
}
function ringState(r) {
  let bi = r.metal === "bicolor",
    g = r.metal === "platin" ? "" : "-" + r.grade;
  return {
    metal: bi ? "gelbgold" + g : r.metal + g,
    metal2: "weissgold" + g,
    bicolor: bi,
    width: +r.width,
    thickness: +r.height,
    profile: r.profile,
    finish: r.finish,
    stones: r.stones,
    stoneSize: +r.stoneSize,
    engraving: r.engraving,
    engravingScript: r.script,
    engravingItalic: r.script === "kursiv",
    size: +r.size || 54,
  };
}
var alloyName = (r) => (r.metal === "platin" ? "Platin 950" : `${ALLOY[r.metal]} ${r.grade}`);
function ringLines(r, sp) {
  let stones = STONE[r.stones];
  r.stones !== "ohne" && sp && (stones += `, je ${de1(sp.stoneDiameter)} mm, zus. ca. ${de1(sp.carat, 2)} ct`);
  let out = [
    ["Legierung", alloyName(r)],
    ["Form", `${PROFILE[r.profile]}, ${de1(r.width)} \xD7 ${de1(r.height)} mm`],
    ["Oberfl\xE4che", FINISH[r.finish]],
    ["Steine", stones],
    ["Gravur", r.engraving ? `„${r.engraving}“ (${SCRIPT[r.script]})` : "keine"],
    ["Ringgr\xF6\xDFe", r.size ? `${r.size} (\xD8 ${de1(r.size / Math.PI)} mm)` : "noch offen"],
  ];
  return (sp && out.push(["Gewicht", `ca. ${de1(sp.weight)} g${r.size ? "" : " bei Gr\xF6\xDFe 54"}`]), out);
}
// Querschnitt der Ringschiene als Zeichnung mit Ma\xDFen
function sectionSvg(sp, r) {
  let p = sp.profile,
    ri = p.ri,
    w = +r.width,
    t = +r.height,
    k = 11,
    cx = 66,
    x0 = cx - (w / 2) * k,
    x1 = cx + (w / 2) * k,
    yb = 34,
    pt = p.pts.map((q) => `${(cx + q.y * k).toFixed(2)},${(yb - (q.r - ri) * k).toFixed(2)}`).join(" "),
    yt = yb - t * k;
  return `<svg viewBox="0 0 120 50" role="img" aria-label="Querschnitt der Ringschiene: ${de1(w)} mm breit, ${de1(t)} mm hoch"><polygon class="sec-body" points="${pt}"/><g class="sec-dim"><path d="M${x0.toFixed(1)} 41H${x1.toFixed(1)}M${x0.toFixed(1)} 38.6v4.8M${x1.toFixed(1)} 38.6v4.8"/><path d="M${(x0 - 5).toFixed(1)} ${yb}V${yt.toFixed(1)}M${(x0 - 7.4).toFixed(1)} ${yb}h4.8M${(x0 - 7.4).toFixed(1)} ${yt.toFixed(1)}h4.8"/></g><text x="${cx}" y="48.6" text-anchor="middle">${de1(w)} mm</text><text x="${(x0 - 9).toFixed(1)}" y="${((yb + yt) / 2 + 1.8).toFixed(1)}" text-anchor="end">${de1(t)} mm</text></svg>`;
}
function setRadio(form, name, value) {
  let n = form.elements[name];
  if (!n) return;
  n instanceof RadioNodeList ? [...n].forEach((i) => (i.checked = i.value === String(value))) : (n.value = value);
}
function rangeFill(i) {
  i && i.style.setProperty("--fill", `${((i.value - i.min) / (i.max - i.min)) * 100}%`);
}

// Startseite: der Ring zum Antippen. Keine Scroll-Steuerung – jede Auswahl wirkt sofort.
function at() {
  let e = c("[data-builder]");
  if (!e) return;
  let form = c("form", e),
    stage = c('[data-ring="story"]', e),
    cfg = studioLoad(),
    ring = cfg.rings[0],
    viewer = null,
    VIEWS = { metal: "front", profile: "side", finish: "front", stones: "top", engraving: "inside" },
    fill = () => {
      (["metal", "profile", "finish", "stones"].forEach((k) => setRadio(form, k, ring[k])), (form.elements.engraving.value = ring.engraving));
    },
    state = () => Object.assign({ mode: "single", stand: !0 }, ringState(ring)),
    tab = (k) => {
      ((e.dataset.tab = k),
        v("[data-tab]", e).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === k))),
        v("[data-group]", e).forEach((g) => g.classList.toggle("is-current", g.dataset.group === k)));
    },
    look = (k) => {
      if (!viewer) return;
      let name = VIEWS[k];
      (name === "top" && ring.stones === "ohne" && (name = "front"), name === "inside" && !ring.engraving && (name = "front"), viewer.view(name));
    };
  (fill(),
    tab("metal"),
    v("[data-tab]", e).forEach((b) =>
      b.addEventListener("click", () => {
        (tab(b.dataset.tab), look(b.dataset.tab));
      }),
    ),
    form.addEventListener("submit", (ev) => ev.preventDefault()),
    form.addEventListener("input", (ev) => {
      let n = ev.target.name;
      if (!(n in ring)) return;
      ((ring[n] = n === "engraving" ? ev.target.value.trim().slice(0, 30) : ev.target.value), R.set(CFG_KEY, cfg), viewer && viewer.set(state()), look(n));
    }));
  if (!stage || !ce()) {
    e.classList.add("no-3d");
    return;
  }
  he(
    e,
    async () => {
      try {
        let [{ createRingViewer: make }] = await Promise.all([de(), be()]);
        ((viewer = make(c("canvas", stage), {
          mode: "single",
          autoRotate: !0,
          interactive: !0,
          preserve: !0,
          reflect: !0,
          fontFamily: '"Fraunces"',
          restPitch: 0.2,
          state: state(),
          onReady: () => {
            ($ || (viewer.setView(-0.3, 0.42, 0.9), viewer.frame({ yaw: 0.35, pitch: 0.2, zoom: 1 })), fe(stage));
          },
        })),
          viewer.setView(0.35, 0.2),
          window.addEventListener("pageswap", () => viewer.renderNow()));
      } catch (x) {
        (console.warn("3D ring unavailable", x), e.classList.add("no-3d"));
      }
    },
    "60% 0px",
  );
}

function lt() {
  let e = c("[data-studio]");
  if (!e) return;
  let form = c("#studio-form", e),
    stage = c('[data-ring="studio"]', e),
    cfg = studioLoad(),
    viewer = null,
    mod = null,
    duo = !1,
    FIT = 36,
    ring = () => cfg.rings[cfg.active],
    specs = (r) => (mod ? mod.ringSpecs(ringState(r)) : null),
    show = () => {
      viewer &&
        (duo
          ? viewer.set({ mode: "duo", fit: 0, rings: cfg.rings.map(ringState) })
          : viewer.set(Object.assign({ mode: "single", stand: !0, fit: FIT }, ringState(ring()))));
    },
    // Formular mit den Werten des gew\xE4hlten Rings f\xFCllen
    fill = () => {
      let r = ring();
      (["metal", "grade", "profile", "finish", "stones", "script"].forEach((k) => setRadio(form, k, r[k])),
        setRadio(form, "stoneSize", r.stoneSize),
        setRadio(form, "which", cfg.active),
        (form.elements.width.value = r.width),
        (form.elements.height.value = r.height),
        (form.elements.engraving.value = r.engraving),
        (form.elements.size.value = r.size));
    },
    last = [[], []],
    paint = (flash) => {
      let r = ring(),
        sp = specs(r),
        el = form.elements,
        set = (sel, txt) => {
          let n = c(sel, e);
          n && (n.textContent = txt);
        };
      (rangeFill(el.width),
        rangeFill(el.height),
        set("[data-width-out]", `${de1(r.width)} mm`),
        set("[data-height-out]", `${de1(r.height)} mm`),
        set("[data-size-out]", r.size ? `\xD8 innen ${de1(r.size / Math.PI)} mm` : ""),
        set("[data-count]", `${r.engraving.length} / 30`),
        set("[data-grade-note]", GRADE_NOTE[r.metal === "platin" ? 950 : r.grade]));
      let g = c("[data-grade]", e),
        ss = c("[data-stone-size]", e),
        so = c("[data-stone-out]", e),
        fig = c("[data-section]", e),
        wt = c("[data-weight]", e);
      (g && (g.hidden = r.metal === "platin"),
        ss && (ss.hidden = r.stones === "ohne"),
        so &&
          (so.textContent =
            r.stones === "ohne" || !sp
              ? ""
              : `${sp.stones} ${sp.stones === 1 ? "Brillant" : "Brillanten"} mit je ${de1(sp.stoneDiameter)} mm Durchmesser, zusammen ca. ${de1(sp.carat, 2)} ct.`),
        fig && sp && (fig.innerHTML = sectionSvg(sp, r)),
        wt &&
          (wt.textContent = sp
            ? `Au\xDFen \xD8 ${de1(sp.outerDiameter)} mm \xB7 Gewicht ca. ${de1(sp.weight)} g${r.size ? "" : " (bei Gr\xF6\xDFe 54)"}`
            : ""));
      v("[data-view]", e).forEach((b) => {
        let k = b.dataset.view;
        (b.setAttribute("aria-pressed", String(k === "duo" ? duo : !duo && k === view)), k === "top" && (b.disabled = r.stones === "ohne"));
      });
      cfg.rings.forEach((x, i) => {
        let ul = c(`[data-summary="${i}"]`, e),
          sub = c(`[data-ring-sub="${i}"]`, e),
          rows = ringLines(x, specs(x));
        (sub && (sub.textContent = `${alloyName(x)} \xB7 ${de1(x.width)} mm`),
          ul &&
            ((ul.innerHTML = ""),
            rows.forEach(([k, val], n) => {
              let li = document.createElement("li");
              ((li.innerHTML = "<span></span><span></span>"),
                (li.children[0].textContent = k),
                (li.children[1].textContent = val),
                flash && last[i][n] && last[i][n][1] !== val && li.classList.add("is-changed"),
                ul.appendChild(li));
            })),
          (last[i] = rows));
      });
      R.set(CFG_KEY, cfg);
    },
    view = "front",
    look = (k) => {
      if (k === "duo") duo = !duo;
      else ((duo = !1), (view = k));
      (show(), viewer && (duo ? viewer.view("front") : viewer.view(view)), paint(!1));
    },
    summary = () =>
      cfg.rings
        .map(
          (r, i) =>
            `Ring ${i + 1}: ` +
            ringLines(r, specs(r))
              .map(([k, val]) => `${k} ${val}`)
              .join("; "),
        )
        .join("\n");
  (fill(),
    paint(!1),
    form.addEventListener("input", (ev) => {
      let t = ev.target,
        n = t.name,
        r = ring();
      if (n === "which") {
        ((cfg.active = +t.value), fill(), duo || show(), paint(!1));
        return;
      }
      if (!(n in r)) return;
      ((r[n] = n === "engraving" ? t.value.slice(0, 30) : n === "width" || n === "height" || n === "stoneSize" ? parseFloat(t.value) : t.value),
        show(),
        paint(!0),
        // der Blick folgt der Auswahl: Gravur innen, Steine von oben, Form im Profil
        viewer &&
          !duo &&
          (n === "engraving" || n === "script"
            ? r.engraving && view !== "inside" && look("inside")
            : n === "stones" || n === "stoneSize"
              ? r.stones !== "ohne"
                ? view !== "top" && look("top")
                : view === "top" && look("front")
              : (n === "width" || n === "height" || n === "profile") && view === "inside" && look("front")));
    }),
    v("[data-view]", e).forEach((b) => b.addEventListener("click", () => look(b.dataset.view))),
    v("[data-insert]", e).forEach((b) =>
      b.addEventListener("click", () => {
        let i = form.elements.engraving,
          a = i.selectionStart ?? i.value.length,
          z2 = i.selectionEnd ?? a;
        ((i.value = (i.value.slice(0, a) + b.dataset.insert + i.value.slice(z2)).slice(0, 30)),
          i.focus(),
          i.setSelectionRange(a + 1, a + 1),
          i.dispatchEvent(new Event("input", { bubbles: !0 })));
      }),
    ),
    c("[data-copy]", e)?.addEventListener("click", () => {
      // den anderen Ring \xFCbernehmen – Gr\xF6\xDFe und Gravur bleiben
      let r = ring(),
        o = cfg.rings[1 - cfg.active];
      (Object.assign(r, { ...o, size: r.size, engraving: r.engraving, script: r.script }), fill(), show(), paint(!0));
    }),
    c("[data-clear]", e)?.addEventListener("click", () => {
      ((cfg = studioDefaults()), (duo = !1), (view = "front"), history.replaceState(null, "", location.pathname), fill(), show(), viewer && viewer.view("front"), paint(!1));
    }),
    c("[data-share]", e)?.addEventListener("click", async (ev) => {
      let b = ev.currentTarget,
        url = `${location.origin}${location.pathname}#c=${encodeURIComponent(JSON.stringify(cfg))}`,
        label = c("span", b) || b,
        old = label.textContent,
        say = (t) => {
          ((label.textContent = t), setTimeout(() => (label.textContent = old), 2200));
        };
      try {
        if (navigator.share && oe("(pointer: coarse)")) await navigator.share({ title: "Meine Trauringe – Juwelier Rubin", url });
        else (await navigator.clipboard.writeText(url), say("Link kopiert"));
      } catch (x) {
        x && x.name === "AbortError" || say("Kopieren nicht m\xF6glich");
      }
    }),
    form.addEventListener("submit", (ev) => {
      (ev.preventDefault(), R.set(se, { cfg, summary: summary() }, "session"), (location.href = form.action));
    }));
  (async () => {
    try {
      let [m] = await Promise.all([de(), be()]);
      ((mod = m), paint(!1));
      if (!ce()) return;
      ((viewer = m.createRingViewer(c("canvas", stage), {
        mode: "single",
        autoRotate: !0,
        interactive: !0,
        preserve: !0,
        reflect: !0,
        fontFamily: '"Fraunces"',
        restPitch: 0.2,
        envSize: !oe("(pointer: coarse)") && (navigator.deviceMemory || 4) >= 8 ? 1024 : void 0,
        state: Object.assign({ mode: "single", stand: !0, fit: FIT }, ringState(ring())),
        onReady: () => {
          ($ || (viewer.setView(-0.4, 0.5, 0.88), viewer.frame({ yaw: 0.35, pitch: 0.2, zoom: 1 })), fe(stage));
        },
      })),
        viewer.setView(0.35, 0.2),
        window.addEventListener("pageswap", () => viewer.renderNow()));
    } catch (x) {
      console.warn("3D ring unavailable", x);
    }
  })();
}
var ne = "rubin-embeds-ok";
function ct() {
  let e = v("[data-embed]");
  if (!e.length) return;
  let a = (t) => {
    if (t.classList.contains("is-loaded")) return;
    if (O) {
      let s = c("[data-embed-preview]", t);
      s && (s.hidden = !1);
      return;
    }
    let n = document.createElement("iframe");
    ((n.src = t.dataset.src),
      (n.title = t.dataset.title),
      (n.loading = "lazy"),
      n.setAttribute("referrerpolicy", "strict-origin-when-cross-origin"),
      t.dataset.embed === "citizen" && ((n.id = "citizenFrame"), n.setAttribute("scrolling", "no")),
      t.replaceChildren(n),
      t.classList.add("is-loaded"));
  };
  (window.addEventListener("message", (t) => {
    if (t.origin !== "https://citizen.retail-showroom.com" || !t.data || t.data.type !== "setHeight") return;
    let n = document.getElementById("citizenFrame");
    if (!n) return;
    let s = parseInt(t.data.height, 10);
    (s > 0 && s < 2e4 && (n.style.height = `${s}px`), t.data.scroll === !0 && n.scrollIntoView({ behavior: $ ? "auto" : "smooth", block: "start" }));
  }),
    e.forEach((t) => {
      c("[data-embed-load]", t)?.addEventListener("click", () => {
        (c("[data-embed-remember]", t)?.checked && R.set(ne, !0), R.get(ne) || O ? e.forEach(a) : a(t));
      });
    }),
    R.get(ne) && !O && e.forEach(a));
}
var ae = null;
function dt() {
  let e = v("[data-map]");
  !e.length ||
    !M.mapModule ||
    e.forEach((a) =>
      he(
        a,
        async () => {
          try {
            ae = ae || import(M.mapModule);
            let { mountMap: t } = await ae,
              n = await t(a, { dataUrl: M.mapData, stores: M.mapStores || [], focus: a.dataset.mapFocus || "all" }),
              s = a.closest("[data-map-scope]") || document;
            (v("[data-locate]", s).forEach((i) => {
              ((i.hidden = !1),
                i.addEventListener("click", () => {
                  let o = a.getBoundingClientRect();
                  ((o.top < 0 || o.bottom > window.innerHeight) && a.scrollIntoView({ block: "center", behavior: $ ? "auto" : "smooth" }),
                    n.show(i.dataset.locate));
                }));
            }),
              v("[data-store]", s).forEach((i) => {
                (i.addEventListener("pointerenter", () => n.highlight(i.dataset.store, !0)),
                  i.addEventListener("pointerleave", () => n.highlight(i.dataset.store, !1)));
              }));
          } catch (t) {
            (a.classList.add("is-failed"), console.warn("map unavailable", t));
          }
        },
        "600px",
      ),
    );
}
function ut() {
  let e = "";
  try {
    e = decodeURIComponent(location.hash.slice(1));
  } catch {}
  let a = e ? document.getElementById(e) : null,
    t = !a && /^(anlass-|filiale-|ring-studio$)/.test(e) ? c("#termin") : null;
  if (M.mode !== "preview" && !t) return;
  let n = a || t,
    s = ["wheel", "touchstart", "keydown", "pointerdown"],
    i = !1,
    o = () => {
      i = !0;
    };
  s.forEach((l) => window.addEventListener(l, o, { passive: !0, capture: !0 }));
  let r = () => {
    i || (n ? n.scrollIntoView({ block: "start" }) : window.scrollY > 0 && window.scrollTo(0, 0));
  };
  (r(), requestAnimationFrame(r));
  let d = () => {
    (r(), setTimeout(r, 150));
    let l = () => {
      i || r();
    };
    (window.addEventListener("scroll", l, { passive: !0 }),
      setTimeout(() => {
        (window.removeEventListener("scroll", l), s.forEach((f) => window.removeEventListener(f, o, { capture: !0 })));
      }, 1500));
  };
  document.readyState === "complete" ? d() : window.addEventListener("load", d, { once: !0 });
}
var ft = [Le, xe, $e, Te, Ve, ut, Fe, Me, Se, Ae, Ie, Re, Ue, ze, Be, Ne, He, Je, Ke, Ze, ct, dt, nt, at, lt];
ft.forEach((e) => {
  try {
    e();
  } catch (a) {
    console.warn(e.name, a);
  }
});
