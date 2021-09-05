// ==UserScript==
// @name         Steloize
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      /^https://cafe.naver.com/stelo([/?].*)?$/
// @icon         https://www.google.com/s2/favicons?domain=naver.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  //const steloizeLink = document.createElement('link')
  //steloizeLink.href = 'https://steloize-fontfaces.000webhostapp.com/steloize.css'
  //steloizeLink.rel = 'stylesheet'
  //document.head.appendChild(steloizeLink)

  let iframeDocument;
  let documentFonts = new Set()
  const fontUrls = {
    'steloize-sej': 'https://steloize-fontfaces.000webhostapp.com/steloize-sej/steloize-sej.woff'
  }

  function loadFont(fontFamily, root) {
    console.log('called')
    const fontFace = new FontFace(fontFamily, `url(${fontUrls[fontFamily]})`)

    fontFace.load()
    .then(loadedFont => {
      console.log(loadedFont)
      root.fonts.add(loadedFont)
    }).catch(error => {
      console.log(error)
      console.error(`failed to fetch "${fontFamily}" whose url is "${fontUrls[fontFamily]}"`)
    })
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function applyFont(element, fonts, root) {
      if (element.dataset.steloized) {
        return
      }

      const targetElement = element
      let text = element.innerText
      let target;
      let resultHtml = ''

      // console.log(element)

      while ((target = text.match(/@@[^@]+@[^@\\]*(?:\\.[^@\\]*)*@@/))) {
        const mainText = target[0].slice(2, -2)
        const delimiterIndex = mainText.indexOf('@')
        const content = mainText.substr(delimiterIndex + 1)
        const fontFamily = `steloize-${escapeHtml(mainText.substr(0, delimiterIndex))}`
        console.log(fontFamily)
        console.log(fonts.has(fontFamily))
        if (!fonts.has(fontFamily)) {
          console.log('adding')
          loadFont(fontFamily, root)
          fonts.add(fontFamily)
        }

        resultHtml += `<span>${escapeHtml(text.slice(0, target.index))}</span>`
        text = text.slice(target.index + target[0].length)
        resultHtml += `<span style="font-family: ${fontFamily}">이부분 폰트가 ${escapeHtml(content)} 바뀝니다</span>`
      }

      resultHtml += text
      resultHtml = resultHtml.replaceAll('\n', '<br>')
      element.innerHTML = resultHtml

      element.dataset.steloized = 'true'
  }

  function applyFonts(element, fonts, root) {
    element.forEach(e => {
      applyFont(e, fonts, root)
    })
  }

  function applyFontToDocument(selector) {
    applyFont(document.querySelector(selector), documentFonts, document)
  }

  function applyFontsToDocument(selector) {
    applyFonts(document.querySelectorAll(selector), documentFonts, document)
  }

  const cafeMain = document.querySelector('#cafe_main')

  cafeMain.addEventListener('load', () => {
    let iframeFonts = new Set()

    function applyFontToIframe(selector) {
      applyFont(iframeDocument.querySelector(selector), iframeFonts, iframeDocument)
    }

    function applyFontsToIframe(selector) {
      applyFonts(iframeDocument.querySelectorAll(selector), iframeFonts, iframeDocument)
    }

    console.log('loaded')

    if (cafeMain.contentWindow) {
      iframeDocument = cafeMain.contentWindow.document
    } else if (cafeMain.contentDocument) {
      iframeDocument = cafeMain.contentDocument
    } else {
      console.error('failed to get iframeDocument')

      return
    }

    let subtitle;
    let subtitleElement;
    if ((subtitleElement = iframeDocument.body.querySelector('#sub-tit .info_tit h3'))) {
      subtitle = subtitleElement.innerText
    }

    console.log(subtitle)

    // reading post
    if (subtitle === undefined) {
      let observer = setInterval(() => {
        if (iframeDocument.querySelector('h3.title_text') && iframeDocument.querySelectorAll('.comment_nick_info a')) {
          applyFontToIframe('h3.title_text')
          applyFontToIframe('.nick_box button')
          applyFontsToIframe('.comment_nick_info a')
          applyFontsToIframe('.text_comment')
          applyFontsToIframe('.comment_text_view a')
          applyFontsToIframe('.se-code-source')

          clearInterval(observer)
        }
      }, 500)
    } else if (['간편게시판'].includes(subtitle)) {
      applyFontsToIframe('#articleList .nick strong')
      applyFontsToIframe('#articleList .cont p')

      // comments
      document.querySelectorAll('.cmlist').forEach(e => {
        e.addEventListener('DOMSubtreeModified', () => {
          console.log('ee')
        })
      })
    } else if (['별별 한마디', '채팅방은 지금', '쪽지 일기장', '창작 끝말잇기', '자기게시판 요청'].includes(subtitle)) {
      applyFontsToIframe('.memo_lst_section p.memo-box')
      applyFontsToIframe('.memo_lst_section .p-nick a')

      // cmlist
    } else if (['출석부'].includes(subtitle)) {
      applyFontsToIframe('.attendance_lst_section .p-nick a')
      applyFontsToIframe('.attendance_lst_section .cmt p')
    } else {
        const sortForms = Array.from(iframeDocument.querySelectorAll('.sort_form a'))
        let sortMethod = 'sort_list';

        applyFontsToIframe('#upperArticleList .inner_list .article')
        applyFontsToIframe('#upperArticleList td.p-nick a')

        for (const sortForm of sortForms) {
          if (sortForm.classList.length === 2) {
            sortMethod = sortForm.classList[0]
            break
          }
        }

        console.log(sortMethod)

        switch (sortMethod) {
          case 'sort_card':
            iframeDocument.querySelectorAll('.con').forEach(card => {
              applyFont(card.querySelector('.inner strong'), iframeFonts, iframeDocument)
              applyFont(card.querySelector('.txt'), iframeFonts, iframeDocument)
              applyFont(card.querySelector('.p-nick a'), iframeFonts, iframeDocument)
            })

            break

          case 'sort_video':
            applyFontsToIframe('.article-album-movie-sub .tit_txt')
            applyFontsToIframe('.article-album-movie-sub td.p-nick a')
            break

          case 'sort_album':
            applyFontsToIframe('.article-album-sub .inner span')
            applyFontsToIframe('.article-album-sub td.p-nick a')
            break

          case 'sort_list':
            applyFonts(iframeDocument.querySelectorAll('.article-board')[1].querySelectorAll('.inner_list .article'), iframeFonts, iframeDocument)
            applyFonts(iframeDocument.querySelectorAll('.article-board')[1].querySelectorAll('.p-nick a'), iframeFonts, iframeDocument)
            break
        }
    }
  })

  applyFontToDocument('a.id > div > div')
  applyFontsToDocument('.cafe-menu-list li a')

  //const lmList = document.querySelector('#lm-list')
  //lmList.addEventListener('DOMSubtreeModified', () => {
    // applyFonts(lmList.querySelectorAll('li a div'))
  //})
  applyFontsToDocument('.group-list li a div')
  applyFontsToDocument('.group-list:last-child li a')
})();

