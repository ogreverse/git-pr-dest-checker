// GitHubのページが更新されたときに処理を実行する
function observePageChanges() {
  const observer = new MutationObserver(() => {
    attachConfirmDialog();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 確認ダイアログを設定する関数
function attachConfirmDialog(retries = 10, delay = 1000) {
  const createButtons = Array.from(
    document.querySelectorAll('button[type="submit"]')
  ).filter((btn) => btn.textContent.includes('Create pull request'));

  // ボタンが見つからない場合リトライ
  if (createButtons.length === 0) {
    if (retries > 0) {
      setTimeout(() => attachConfirmDialog(retries - 1, delay), delay);
    }
    return false;
  }

  createButtons.forEach((createButton) => {
    if (createButton.dataset.confirmAttached) {
      return;
    }
    createButton.dataset.confirmAttached = 'true';

    // イベントが有効になっていることを示すためにボタンの色を変更
    createButton.style.backgroundColor = '#3191d8';

    const handler = function (event) {
      event.preventDefault();

      // すでにダイアログが表示されているなら新たに追加しない
      if (document.getElementById('pr-base-checker-dialog')) {
        return;
      }

      const baseBranchElement = document.querySelector(
        '#base-ref-selector > summary > span > span > span'
      );
      const baseBranch = baseBranchElement
        ? baseBranchElement.textContent.trim()
        : '不明';

      const confirmDialog = document.createElement('div');
      confirmDialog.id = 'pr-base-checker-dialog';
      confirmDialog.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; box-shadow: 0px 0px 10px rgba(0,0,0,0.3); 
                        z-index: 1000; border-radius: 8px; text-align: center;">
                <p style="color: black;">現在 Pull Request の向き先は "<strong>${baseBranch}</strong>" です。</p>
                <button id="dialog-cancel" style="margin: 5px; padding: 8px 12px;">キャンセル</button>
                <button id="dialog-confirm" style="margin: 5px; padding: 8px 12px;">確認</button>
            </div>
        `;
      document.body.appendChild(confirmDialog);

      document
        .getElementById('dialog-cancel')
        .addEventListener('click', function () {
          confirmDialog.remove();
        });

      document
        .getElementById('dialog-confirm')
        .addEventListener('click', function () {
          confirmDialog.remove();

          // このリスナーを外してから click() する
          createButton.removeEventListener('click', handler);
          createButton.click(); // 元々のボタンの動作を実行
          createButton.addEventListener('click', handler);
        });
    };

    // イベントリスナーを付与
    createButton.addEventListener('click', handler);
  });
}

// GitHubのTurboページ遷移に対応するために `turbo:load` を監視
document.addEventListener('turbo:load', attachConfirmDialog);
observePageChanges();

attachConfirmDialog();
