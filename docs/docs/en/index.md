# Obsidian Spaced Repetition

<img src="https://img.shields.io/github/downloads/st3v3nmw/obsidian-spaced-repetition/total" /> <img src="https://img.shields.io/github/downloads/st3v3nmw/obsidian-spaced-repetition/latest/total?style=flat-square" /> <img src="https://img.shields.io/github/manifest-json/v/st3v3nmw/obsidian-spaced-repetition?style=flat-square" />

Fight the forgetting curve by reviewing flashcards & notes using spaced repetition on Obsidian.md

<div class="grid" markdown>

!!! tip "Getting started"

    :material-circle-medium: View the [quick demo](index.md#quick-demo) below<br/>
    :material-circle-medium: [Plugin installation](index.md#installation)<br/>
    :material-circle-medium: General [guidelines & tips](resources.md) about spaced repetition learning.

!!! tip "Features"

    :material-circle-medium: [Flashcards](flashcards/flashcards-overview.md) &nbsp; &nbsp; :material-circle-medium: [Notes](notes.md) <br/>
    :material-circle-medium: [User Options](user-options.md) &nbsp; &nbsp; :material-circle-medium: [Commands](plugin-commands.md)
    <hr class="thin">
    :material-circle-medium: [Repetition Algorithms](algorithms.md) &nbsp; &nbsp; :material-circle-medium: [Data Storage](data-storage.md)

!!! tip "Help & Support"

    :material-circle-medium: Visit the [discussions](https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/) section for Q&A help, feedback, and general discussion.<br/>
    :material-circle-medium: Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/) if you have a feature request or a bug report.

!!! tip "Contributing"

    :material-circle-medium: The plugin has been translated into over [10 languages](contributing.md#translating) by the Obsidian community 😄. To help translate this plugin to your language, check the [translation guide here](contributing.md#translating).<br/>
    :material-circle-medium: Software developers can contribute [feature enhancements and bug fixes](contributing.md#code)

</div>

---

## Quick Demo

![user-interface-overview](https://github.com/user-attachments/assets/977bab30-cc5e-4b5c-849e-3881d82b3f8e)

!!! note ""

    1. Display the [Note Review Queue](notes.md#note-review-queue) <br/>
    2. Note review queue<br/>
    3. Display the Obsidian command dialog to access the plugin [commands](plugin-commands.md)<br/>
    4. `Flashcard Review Icon` Select a flashcard [deck](flashcards/reviewing.md#deck-selection) to [review](flashcards/reviewing.md#reviewing) <br/>
    5. Identify that flashcards within this note are in the `#flashcards/science/physics` [deck](flashcards/decks.md#using-obsidian-tags)<br/>
    6. A [single line question](flashcards/q-and-a-cards.md#single-line-basic) (identified by the `::` separating the question and answer)<br/>
    7. The plugin stores scheduling info within this [HTML comment](data-storage.md#individual-markdown-files) <br/>
    8. `Spaced Repetition Status Area` The number of notes and flashcards currently due for review. Click to [open a note for review](notes.md#selecting-a-note-for-review).

<video controls>
  <source src="https://user-images.githubusercontent.com/43380836/115256965-5d455f00-a138-11eb-988f-27ba29f328a0.mp4" type="video/mp4">
</video>

---

## Installation

You can easily install the plugin from Obsidian's community plugin section in the Obsidian app (Search for `Spaced Repetition`).

### Manual Installation

!!! note "Advanced"

    Create an `obsidian-spaced-repetition` folder under `.obsidian/plugins` in your vault. Add the `main.js`, `manifest.json`, and the `styles.css` files from the [latest release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases) to the folder.

---

## Support

<a href='https://ko-fi.com/M4M44DEN6' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
