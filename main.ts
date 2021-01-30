import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault, addIcon, WorkspaceLeaf, iterateCacheRefs, getLinkpath } from 'obsidian';

const SCHEDULING_INFO_REGEX = /<!--DUE: ([0-9]+), INTERVAL: ([0-9]+), EASE: ([.0-9]+)-->/;

export default class MyPlugin extends Plugin {
	async onload() {
		console.log("loading Notes Review plugin...");''

		// addIcon('libraryreview', `<path fill="white" stroke="white" d="m328.853 56.033c-38.598 0-70 31.402-70 70s31.402 70 70 70 70-31.402 70-70-31.402-70-70-70zm0 120c-27.57 0-50-22.43-50-50s22.43-50 50-50 50 22.43 50 50-22.43 50-50 50z"/><path fill="white" stroke="white" d="m502.924 253.962-76.735-76.735c8.08-15.3 12.664-32.72 12.664-51.193 0-60.654-49.346-110-110-110s-110 49.346-110 110c0 26.569 9.469 50.968 25.209 70h-203.996c-3.028 0-5.893 1.372-7.791 3.73-16.367 20.338-16.367 52.201 0 72.539 1.898 2.358 4.763 3.73 7.791 3.73h23.282c-4.449 12.792-4.449 27.208 0 40h-43.282c-3.028 0-5.893 1.372-7.791 3.73-16.367 20.338-16.367 52.201 0 72.539 1.898 2.358 4.763 3.73 7.791 3.73h13.282c-6.491 18.663-3.523 40.799 8.928 56.27 1.898 2.358 4.763 3.73 7.791 3.73h60v30c0 4.045 2.437 7.691 6.173 9.239 3.737 1.546 8.038.692 10.898-2.168l22.929-22.929 22.929 22.929c1.914 1.913 4.471 2.929 7.074 2.929 1.288 0 2.587-.249 3.824-.761 3.737-1.548 6.173-5.194 6.173-9.239v-30h150c5.523 0 10-4.478 10-10s-4.477-10-10-10h-4.782c-6.918-11.719-6.918-28.281 0-40h4.782c5.523 0 10-4.478 10-10s-4.477-10-10-10h-34.782c-6.918-11.719-6.918-28.281 0-40h64.782c5.523 0 10-4.478 10-10s-4.477-10-10-10h-4.782c-6.918-11.719-6.918-28.281 0-40h4.782c5.523 0 10-4.478 10-10s-4.477-10-10-10h-44.768c-3.445-5.837-5.269-13.02-5.215-20.35 2.894.229 5.818.35 8.77.35 19.523 0 37.871-5.119 53.782-14.075l76.147 76.146c6.085 6.085 14.078 9.127 22.071 9.127s15.986-3.042 22.071-9.127c5.896-5.896 9.143-13.733 9.143-22.071s-3.249-16.175-9.144-22.07zm-332.858 207.928-12.929-12.929c-3.905-3.904-10.237-3.904-14.143 0l-12.929 12.929v-35.857h40v35.857zm143.282-25.857h-123.282v-10h10c5.523 0 10-4.478 10-10s-4.477-10-10-10h-100c-5.523 0-10 4.478-10 10s4.477 10 10 10h10v10h-54.785c-6.921-11.724-6.894-28.281.034-40h258.033c-4.449 12.791-4.449 27.208 0 40zm-30-60h-258.067c-6.918-11.719-6.918-28.281 0-40h258.067c-4.449 12.791-4.449 27.208 0 40zm60-60h-258.064c-6.918-11.719-6.918-28.281 0-40h258.064c-4.449 12.791-4.449 27.208 0 40zm-39.984-60h-258.083c-6.918-11.719-6.918-28.281 0-40h220.4c10.342 7.28 21.988 12.822 34.514 16.206-.505 8.191.584 16.326 3.169 23.794zm-64.511-130c0-49.626 40.374-90 90-90s90 40.374 90 90-40.374 90-90 90-90-40.374-90-90zm249.928 157.929c-4.371 4.373-11.485 4.373-15.857 0l-73.566-73.565c5.745-4.809 10.993-10.191 15.655-16.06l73.768 73.768c2.118 2.118 3.284 4.934 3.284 7.929s-1.166 5.81-3.284 7.928z"/>`);

		this.new_notes = [];
		this.overdue_notes = [];
		this.statusBar = this.addStatusBarItem();
		await this.getNotesToReview();

		this.addRibbonIcon('dice', 'Review Note', async () => {
			await this.getNotesToReview();

			if (this.overdue_notes.length + this.new_notes.length == 0) {
				new Notice("You're done for the day :D.");
				return;
			}

			if (this.overdue_notes.length > 0) {
				let cNote = this.overdue_notes[0];
				for (let note of this.overdue_notes) {
					if (note['due_unix'] > cNote['due_unix'])
						cNote = note;
				}
				this.app.workspace.activeLeaf.openFile(cNote['note']);
				return;
			}

			if (this.new_notes.length > 0) {
				let cNote = this.new_notes[0];
				for (let note of this.new_notes) {
					if (note['due_unix'] > cNote['due_unix'])
						cNote = note;
				}
				this.app.workspace.activeLeaf.openFile(cNote['note']);
			}
		});

		this.addCommand({
			id: 'mark-as-reviewed-easy',
			name: 'Easy',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.saveReviewResponse(1);
						new Notice("Response received.");
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'mark-as-reviewed-hard',
			name: 'Hard',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.saveReviewResponse(0);
						new Notice("Response received.");
					}
					return true;
				}
				return false;
			}
		});
	}

	async getNotesToReview() {
		let notes = this.app.vault.getMarkdownFiles();
		let scheduled_notes = {};
		this.overdue_notes = [];

		let links = {};
		notes.forEach(n_file => {
			links[n_file.path] = [];
		});
		notes.forEach(n_file => {
			iterateCacheRefs(this.app.metadataCache.getFileCache(n_file), cb => {
				let txt = this.app.metadataCache.getFirstLinkpathDest(getLinkpath(cb.link), n_file.path);
				if (txt != null) {
					links[n_file.path].push(txt.path);
					links[txt.path].push(n_file.path);
				}
			});
		});
		
		let temp_new = [];
		for (let note of notes) {
			let file_text = await this.app.vault.read(note);

			if (!/<!--IGNORE-->/.test(file_text)) { // checks if note should be ignored 
				if (file_text.split(/\r\n|\r|\n/).length >= 3) { // file should have more than 3 or more lines
					if (!SCHEDULING_INFO_REGEX.test(file_text)) { // file has no scheduling information
						temp_new.push([note, file_text]);
						continue;
					}

					let scheduling_info = SCHEDULING_INFO_REGEX.exec(file_text);
					let due_unix = parseInt(scheduling_info[1]);
					let interval = parseInt(scheduling_info[2]);
					let ease = parseFloat(scheduling_info[3]);
					scheduled_notes[note.path] = [note, due_unix, interval, ease];
				}
			}
		}

		for (let new_note of temp_new) {
			let total = 0, count = 0;
			for (let linked_file of links[new_note[0].path]) {
				let q = scheduled_notes[linked_file];
				if (q) {
					total += q[3];
					count += 1;
				}
			}
			let interval = 1;
			let due_unix = +new Date + 24 * 3600 * 1000;
			let ease = count == 0 ? 2.0 : (4 + total / count) / 3;
			file_text = `<!--DUE: ${due_unix}, INTERVAL: ${interval}, EASE: ${ease}-->\n\n${new_note[1]}`;
			this.app.vault.modify(new_note[0], file_text);
		}

		let now = +new Date();
		for (let note in scheduled_notes) {
			note = scheduled_notes[note];
			if (Math.floor(note[1] / (24 * 3600 * 1000)) * 24 * 3600 * 1000 < now)
				this.overdue_notes.push({note: note[0], due_unix, interval, ease});
		}
		this.statusBar.setText(`Review: ${this.overdue_notes.length} due`);
	}

	async saveReviewResponse(quality: int) {
		let note = this.app.workspace.activeLeaf.view.file;
		let file_text = await this.app.vault.read(note);

		let interval = -1, ease = -1;
		if (!/<!--IGNORE-->/.test(file_text)) { // checks if note should be ignored 
			if (file_text.split(/\r\n|\r|\n/).length >= 3) { // file should have more than 3 or more lines
				let scheduling_info = SCHEDULING_INFO_REGEX.exec(file_text);
				interval = parseInt(scheduling_info[2]);
				ease = parseFloat(scheduling_info[3]);
			}
		}
		ease = Math.max(1, quality == 1 ? ease * 1.25 : ease * 0.8);
		interval = Math.max(1, Math.floor(quality == 1 ? interval * ease : interval * 0.5));
		file_text = file_text.replace(SCHEDULING_INFO_REGEX, `<!--DUE: ${(+new Date) + interval * 24 * 3600 * 1000}, INTERVAL: ${interval}, EASE: ${ease}-->`);
		this.app.vault.modify(note, file_text);
	}
}