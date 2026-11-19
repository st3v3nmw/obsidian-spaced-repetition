import { RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";

const SR_COMMENT_WITH_OPTIONAL_LEADING_SPACE = /\s?<!--SR:.+?-->/g;

export function createSRCommentHiderExtension(isEnabled: () => boolean) {
    class SRCommentHiderPlugin implements PluginValue {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (
                update.docChanged ||
                update.viewportChanged ||
                update.selectionSet ||
                update.state.field(editorLivePreviewField, false) !==
                    update.startState.field(editorLivePreviewField, false)
            ) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        destroy() {}

        buildDecorations(view: EditorView): DecorationSet {
            if (!isEnabled()) {
                return Decoration.none;
            }

            const isLivePreview = view.state.field(editorLivePreviewField, false);
            if (!isLivePreview) {
                return Decoration.none;
            }

            const builder = new RangeSetBuilder<Decoration>();
            const selection = view.state.selection;

            for (const { from, to } of view.visibleRanges) {
                const text = view.state.sliceDoc(from, to);
                const regex = new RegExp(SR_COMMENT_WITH_OPTIONAL_LEADING_SPACE.source, "g");
                let match: RegExpExecArray | null;

                while ((match = regex.exec(text)) !== null) {
                    const start = from + match.index;
                    const end = start + match[0].length;

                    // Check if the cursor or selection is on the same line
                    const line = view.state.doc.lineAt(start);
                    const isLineActive = selection.ranges.some(
                        (range) => range.from <= line.to && range.to >= line.from,
                    );

                    if (!isLineActive) {
                        builder.add(
                            start,
                            end,
                            Decoration.replace({
                                inclusive: false,
                            }),
                        );
                    }
                }
            }

            return builder.finish();
        }
    }

    return ViewPlugin.fromClass(SRCommentHiderPlugin, {
        decorations: (value: SRCommentHiderPlugin) => value.decorations,
    });
}
