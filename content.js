// 確認ダイアログを作成する共通関数
function createConfirmDialog(
  message,
  dialogId,
  cancelButtonId,
  confirmButtonId
) {
  const confirmDialog = document.createElement('div');
  confirmDialog.id = dialogId;
  confirmDialog.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 20px; box-shadow: 0px 0px 10px rgba(0,0,0,0.3); 
                z-index: 1000; border-radius: 8px; text-align: center;">
      <p style="color: black;">${message}</p>
      <button id="${cancelButtonId}" style="margin: 5px; padding: 8px 12px;">キャンセル</button>
      <button id="${confirmButtonId}" style="margin: 5px; padding: 8px 12px;">確認</button>
    </div>
  `;
  document.body.appendChild(confirmDialog);
  return confirmDialog;
}

// ボタンに確認ダイアログを設定する共通関数
function attachConfirmDialogToButtons(config) {
  const {
    buttonSelector,
    buttonFilter,
    dialogId,
    cancelButtonId,
    confirmButtonId,
    getMessage,
    dataAttribute,
    retries = 10,
    delay = 1000,
    useCapture = false,
  } = config;

  const buttons = Array.from(document.querySelectorAll(buttonSelector)).filter(
    buttonFilter
  );

  // ボタンが見つからない場合リトライ
  if (buttons.length === 0) {
    if (retries > 0) {
      setTimeout(
        () => attachConfirmDialogToButtons({ ...config, retries: retries - 1 }),
        delay
      );
    }
    return false;
  }

  buttons.forEach((button) => {
    if (button.dataset[dataAttribute]) {
      return;
    }
    button.dataset[dataAttribute] = 'true';

    // ボタンの色を青くする
    button.style.backgroundColor = '#3191d8';

    const handler = function (event) {
      event.preventDefault();
      if (useCapture) {
        event.stopPropagation();
      }

      // すでにダイアログが表示されているなら新たに追加しない
      if (document.getElementById(dialogId)) {
        return;
      }

      const message = getMessage();
      const confirmDialog = createConfirmDialog(
        message,
        dialogId,
        cancelButtonId,
        confirmButtonId
      );

      document
        .getElementById(cancelButtonId)
        .addEventListener('click', function () {
          confirmDialog.remove();
        });

      document
        .getElementById(confirmButtonId)
        .addEventListener('click', function () {
          confirmDialog.remove();

          // このリスナーを外してから click() する
          button.removeEventListener('click', handler, useCapture);
          button.click(); // 元々のボタンの動作を実行
          button.addEventListener('click', handler, useCapture);
        });
    };

    // イベントリスナーを付与
    button.addEventListener('click', handler, useCapture);
  });
}

// GitHubのページが更新されたときに処理を実行する
function observePageChanges() {
  const observer = new MutationObserver(() => {
    attachBranchConfirmDialog();
    attachMergeConfirmDialog();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ブランチ確認ダイアログを設定する関数
function attachBranchConfirmDialog() {
  attachConfirmDialogToButtons({
    buttonSelector: 'button[type="submit"]',
    buttonFilter: (btn) => btn.textContent.includes('Create pull request'),
    dialogId: 'pr-base-checker-dialog',
    cancelButtonId: 'dialog-cancel',
    confirmButtonId: 'dialog-confirm',
    getMessage: () => {
      const baseBranchElement = document.querySelector(
        '#base-ref-selector > summary > span > span > span:nth-child(2)'
      );
      const baseBranch = baseBranchElement
        ? baseBranchElement.textContent.trim()
        : '不明';
      return `現在 Pull Request の向き先は "<strong>${baseBranch}</strong>" です。`;
    },
    dataAttribute: 'confirmAttached',
  });
}

// マージボタンに確認ダイアログを設定する関数
function attachMergeConfirmDialog() {
  const mergeButtonTexts = [
    'Merge pull request',
    'Squash and merge',
    'Rebase and merge',
  ];

  attachConfirmDialogToButtons({
    buttonSelector: 'button[type="button"]',
    buttonFilter: (btn) => {
      const buttonText = btn.textContent.trim();
      return mergeButtonTexts.some((text) => buttonText.includes(text));
    },
    dialogId: 'pr-merge-checker-dialog',
    cancelButtonId: 'dialog-cancel-merge',
    confirmButtonId: 'dialog-confirm-merge',
    getMessage: () => {
      const titleElement = document.querySelector(
        'bdi.js-issue-title.markdown-title'
      );
      const title = titleElement
        ? titleElement.textContent.trim()
        : 'このプルリクエスト';
      return `<strong>${title}</strong> を Merge します。よろしいですか？`;
    },
    dataAttribute: 'mergeConfirmAttached',
    useCapture: true,
  });
}

// GitHubのTurboページ遷移に対応するために `turbo:load` を監視
document.addEventListener('turbo:load', attachBranchConfirmDialog);
document.addEventListener('turbo:load', attachMergeConfirmDialog);
observePageChanges();

attachBranchConfirmDialog();
attachMergeConfirmDialog();
