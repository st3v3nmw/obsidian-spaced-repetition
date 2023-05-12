.PHONY: setup_e2e
setup_e2e:
	rm -rf tests/e2e/vault
	mkdir --parents tests/e2e/vault/.obsidian/plugins/obsidian-spaced-repetition/
	pnpm build
	cp build/main.js tests/e2e/vault/.obsidian/plugins/obsidian-spaced-repetition/
	cp styles.css tests/e2e/vault/.obsidian/plugins/obsidian-spaced-repetition/
	cp manifest.json tests/e2e/vault/.obsidian/plugins/obsidian-spaced-repetition/
