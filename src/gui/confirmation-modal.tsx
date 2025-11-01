import { App, Modal, Notice, Setting } from 'obsidian';
import { t } from 'src/lang/helpers';

export class ConfirmationModal extends Modal {
  constructor(app: App, title: string, message: string, confirmationMessage?: string, onConfirm?: () => void) {
    super(app);
    
    this.setTitle(title);
    this.titleEl.addClass('modal-header');

    this.setContent(message);
    this.contentEl.addClass('modal-content');

    new Setting(this.contentEl).setClass('modal-button-container')
      .addButton((button) =>
        button
          .setButtonText(t('CONFIRM'))
          .setClass('mod-warning')
          .onClick(() => {
            if (onConfirm) {
              onConfirm();
            }
            if (confirmationMessage) {
              new Notice(confirmationMessage);
            }
            this.close();
          })
        )
        .addButton((button) =>
          button
            .setButtonText(t('CANCEL')).onClick(() => {
                this.close();
              })
            );
  }
}