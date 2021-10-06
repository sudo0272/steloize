// ==UserScript==
// @name         Steloize
// @namespace    http://tampermonkey.net/
// @version      0.0.9
// @description  Apply custom fonts to stelo
// @author       ecNQTD9AEQECLM4W62ei
// @include      /^https://cafe.naver.com/stelo([/?].*)?$/
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  //const steloizeLink = document.createElement('link')
  //steloizeLink.href = 'https://steloize-fontfaces.000webhostapp.com/steloize.css'
  //steloizeLink.rel = 'stylesheet'
  //document.head.appendChild(steloizeLink)

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  class FontApplier {
    constructor(root) {
      this.root = root;
      this.appliedFonts = new Set();
    }

    loadFont(fontFamily) {
      const fontFace = new FontFace(
        fontFamily,
        `url(https://steloize-fontfaces.000webhostapp.com/font.php?family=${fontFamily})`
      );

      fontFace
        .load()
        .then((loadedFont) => {
          this.root.fonts.add(loadedFont);
        })
        .catch(() => {
          alert(`steloize: ${fontFamily} 폰트 다운로드에 실패했습니다`);
        });
    }

    applyFont(element) {
      if (!element || element.dataset.steloized) {
        return;
      }

      let text = element.innerText;
      let target;
      let resultHtml = "";

      while ((target = text.match(/@@[^@]+@[^@\\]*(?:\\.[^@\\]*)*@@/))) {
        const mainText = target[0].slice(2, -2);
        const delimiterIndex = mainText.indexOf("@");
        const content = mainText.substr(delimiterIndex + 1);
        const subject = mainText.substr(0, delimiterIndex);
        let fontFamily;

        switch (subject) {
          case "^":
            fontFamily = escapeHtml(content);
            resultHtml += `<span style="font-family: ${fontFamily}">`;
            break;

          case "/^":
            resultHtml += `<span>${escapeHtml(
              text.slice(0, target.index)
            ).replaceAll(" ", "&nbsp;")}</span>`;
            fontFamily = "";
            resultHtml += `</span>`;
            break;

          default:
            fontFamily = `steloize-${escapeHtml(subject)}`;
            resultHtml += `<span>${escapeHtml(
              text.slice(0, target.index)
            ).replaceAll(" ", "&nbsp;")}</span>`;
            resultHtml += `<span style="font-family: ${fontFamily}">${escapeHtml(
              content
            ).replaceAll(" ", "&nbsp;")}</span>`;
            break;
        }

        if (!this.appliedFonts.has(fontFamily) && fontFamily) {
          this.loadFont(fontFamily);
          this.appliedFonts.add(fontFamily);
        }

        text = text.slice(target.index + mainText.length + 4);
      }

      resultHtml += text.replaceAll(" ", "&nbsp;");
      resultHtml = resultHtml.replaceAll("\n", "<br>");
      element.innerHTML = resultHtml;

      element.dataset.steloized = "true";
    }

    applyFontBySelector(selector) {
      this.applyFont(this.root.querySelector(selector));
    }

    applyFontsBySelector(selector) {
      this.root.querySelectorAll(selector).forEach((element) => {
        this.applyFont(element);
      });
    }
  }

  const documentFontApplier = new FontApplier(document);

  documentFontApplier.applyFontBySelector("a.id > div > div");
  documentFontApplier.applyFontsBySelector(".cafe-menu-list li a");
  documentFontApplier.applyFontsBySelector(".group-list li a div");
  documentFontApplier.applyFontsBySelector(".group-list:last-child li a");

  const cafeMain = document.querySelector("#cafe_main");

  cafeMain.addEventListener("load", () => {
    const mainFontApplier = new FontApplier(cafeMain.contentDocument);

    let subtitle;
    let subtitleElement;
    if (
      (subtitleElement = cafeMain.contentDocument.body.querySelector(
        "#sub-tit .info_tit h3"
      ))
    ) {
      subtitle = subtitleElement.innerText;
    }

    // reading post
    if (subtitle === undefined) {
      let observer = setInterval(() => {
        if (
          cafeMain.contentDocument.querySelector("h3.title_text") &&
          cafeMain.contentDocument.querySelectorAll(".comment_nick_info a")
        ) {
          mainFontApplier.applyFontBySelector("h3.title_text");
          mainFontApplier.applyFontBySelector(".nick_box button");
          mainFontApplier.applyFontsBySelector(".comment_nick_info a");
          mainFontApplier.applyFontsBySelector(".text_comment");
          mainFontApplier.applyFontsBySelector(".comment_text_view a");
          mainFontApplier.applyFontsBySelector(".se-code-source");

          clearInterval(observer);
        }
      }, 500);
    } else if (["간편게시판"].includes(subtitle)) {
      mainFontApplier.applyFontsBySelector("#articleList .nick strong");
      mainFontApplier.applyFontsBySelector("#articleList .cont p");

      // comments
      // document.querySelectorAll('.cmlist').forEach(e => {
      // e.addEventListener('DOMSubtreeModified', () => {
      // console.log('ee')
      // })
      // })
    } else if (
      [
        "별별 한마디",
        "채팅방은 지금",
        "쪽지 일기장",
        "창작 끝말잇기",
        "자기게시판 요청",
      ].includes(subtitle)
    ) {
      mainFontApplier.applyFontsBySelector(".memo_lst_section p.memo-box");
      mainFontApplier.applyFontsBySelector(".memo_lst_section .p-nick a");

      // cmlist
    } else if (["출석부"].includes(subtitle)) {
      mainFontApplier.applyFontsBySelector(".attendance_lst_section .p-nick a");
      mainFontApplier.applyFontsBySelector(".attendance_lst_section .cmt p");
    } else {
      const sortForms = Array.from(
        cafeMain.contentDocument.querySelectorAll(".sort_form a")
      );
      let sortMethod = "sort_list";

      mainFontApplier.applyFontsBySelector(
        "#upperArticleList .inner_list .article"
      );
      mainFontApplier.applyFontsBySelector("#upperArticleList td.p-nick a");

      for (const sortForm of sortForms) {
        if (sortForm.classList.length === 2) {
          sortMethod = sortForm.classList[0];
          break;
        }
      }

      switch (sortMethod) {
        case "sort_card":
          cafeMain.contentDocument.querySelectorAll(".con").forEach((card) => {
            mainFontApplier.applyFont(card.querySelector(".inner strong"));
            mainFontApplier.applyFont(card.querySelector(".txt"));
            mainFontApplier.applyFont(card.querySelector(".p-nick a"));
          });

          break;

        case "sort_video":
          mainFontApplier.applyFontsBySelector(
            ".article-album-movie-sub .tit_txt"
          );
          mainFontApplier.applyFontsBySelector(
            ".article-album-movie-sub td.p-nick a"
          );
          break;

        case "sort_album":
          mainFontApplier.applyFontsBySelector(
            ".article-album-sub .inner span"
          );
          mainFontApplier.applyFontsBySelector(
            ".article-album-sub td.p-nick a"
          );
          break;

        case "sort_list":
          mainFontApplier.applyFontsBySelector(
            ".article-board:nth-child(2) .inner_list .article"
          );
          mainFontApplier.applyFontsBySelector(
            ".article-board:nth-child(2) .p-nick a"
          );
          break;
      }
    }
  });
})();
