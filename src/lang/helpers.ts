import { IBaseLocale } from "src/lang/base-locale";
import en from "src/lang/locale/en";
import { LocaleManager, LocaleManagerInstance } from "src/lang/locale-manager";

// Initialize the locale manager
LocaleManagerInstance.instance = new LocaleManager();

/**
 * Inserts parameters into the translation string
 *
 * @param translation The translation string
 * @param params Parameters to insert into the translation string
 * @returns {string}
 */
function insertParameters(translation: string, params: Record<string, unknown>): string {
    // https://stackoverflow.com/a/41015840/
    // Retrieve names of parameters
    const names: string[] = Object.keys(params);
    // Retrieve values of parameters
    const vals: unknown[] = Object.values(params);

    function replaceNamesWithValues(translation: string, names: string[], vals: unknown[]): string {
        let result: string = translation;

        for (let i = 0; i < names.length; i++) {
            const name: string = names[i];
            const value: string = `${vals[i]}`; // Force string conversion of value

            // Replace name with value
            result = result.replace("${" + name + "}", value);
        }

        return result;
    }

    return replaceNamesWithValues(translation, names, vals);
}

/**
 * Retrieves the translation via the current locale and inserts parameters into it
 *
 * @param translationKey Key to access the specific translation
 * @param params Parameters to insert into the translation
 * @returns {string} The translation
 */
export function t(translationKey: keyof IBaseLocale, params?: Record<string, unknown>): string {
    const currentLocale: string = LocaleManagerInstance.getInstance().currentLocale;
    const currentLocaleMap: IBaseLocale = LocaleManagerInstance.getInstance().currentTranslation();

    // Retrieve translation from locale. Fall back to english if something went wrong
    const translation = (currentLocale && currentLocaleMap[translationKey]) || en[translationKey];

    if (params) {
        return insertParameters(translation, params);
    }

    return translation;
}

/**
 * Retrieves the translation via the current locale and inserts parameters into it
 *
 * @param translationKey Key to access the specific translation
 * @param params Parameters to insert into the translation
 * @returns {(HTMLElement | Text)[]} The translation as an array of HTML elements. This is used for translations that contain links in them. The array contains text and link elements in the correct order to be assembled together.
 */
export function tHTML(
    translationKey: keyof IBaseLocale,
    params?: Record<string, unknown>,
): (HTMLElement | Text)[] {
    return parseHTMLTags(t(translationKey, params)).map(
        (translationElement: ITranslationElement) => translationElement.element,
    );
}

export interface ITranslationElement {
    element: HTMLElement | Text;
    start: number;
    end: number;
}

/**
 * Returns an array of html elements to assemble the text with the link/code elements in them
 *
 * WARNING: This just returns nothing if the anchor tag was malformed so make sure the translation is good
 *
 * @param translation The translation to be parsed for anchor elements
 * @returns {ITranslationElement}
 */
export function parseHTMLTags(translation: string): ITranslationElement[] {
    const resultArray: ITranslationElement[] = [];

    // Go through the translation to find any anchor elements
    for (let currentPosition: number = 0; currentPosition < translation.length; currentPosition++) {
        const anchorPosition = translation.indexOf("<a", currentPosition);
        const codePosition = translation.indexOf("<code", currentPosition);

        const noAnchorTagsFound = anchorPosition === -1;
        const noCodeTagsFound = codePosition === -1;
        const noTagsFound = noAnchorTagsFound && noCodeTagsFound;

        const handleAnchorFirst =
            (anchorPosition < codePosition && !noAnchorTagsFound) || noCodeTagsFound;
        const relevantPosition = handleAnchorFirst ? anchorPosition : codePosition;

        if (noTagsFound || relevantPosition > currentPosition) {
            // Add text element if there is some text before the tag or at the end of the translation
            const startOfText =
                resultArray.length === 0 ? 0 : resultArray[resultArray.length - 1].end + 1;
            const endOfText = noTagsFound ? translation.length - 1 : relevantPosition - 1;

            resultArray.push(createTranslationTextElement(translation, startOfText, endOfText));
            if (noTagsFound) break;
        }

        if (handleAnchorFirst) {
            const linkRegex: RegExp = /<a.+href="(.+)".*>(.+)<\/a>/;
            const linkMatch: RegExpMatchArray | null = linkRegex.exec(translation);
            if (linkMatch) {
                // Here I just assume that the href exists and the text is the inner text else the function will fail
                const href: string = linkMatch[1];
                const text: string = linkMatch[2];

                const anchorElement: HTMLElement = activeDocument.createElement("a");
                anchorElement.setAttribute("href", href);
                anchorElement.setText(text);

                resultArray.push({
                    element: anchorElement,
                    start: anchorPosition,
                    end: anchorPosition + linkMatch[0].length - 1,
                });
            } else {
                return []; // Malformed anchor tag
            }

            // Update the current position to the end of the anchor tag
            currentPosition = anchorPosition + linkMatch[0].length - 1;
        } else {
            // Handle a code tag
            const codeRegex: RegExp = /<code.*>(.+)<\/code>/;
            const codeMatch = codeRegex.exec(translation);
            if (codeMatch) {
                // Here I just assume that the text is the inner text else the function will fail
                const text: string = codeMatch[1];

                const codeElement: HTMLElement = activeDocument.createElement("code");
                codeElement.setText(text);

                resultArray.push({
                    element: codeElement,
                    start: codePosition,
                    end: codePosition + codeMatch[0].length - 1,
                });
            } else {
                return []; // Malformed anchor tag
            }
            // Update the current position to the end of the anchor tag
            currentPosition = codePosition + codeMatch[0].length - 1;
        }
    }

    return resultArray;
}

/**
 * Creates a text element from the given translation
 *
 * @param translation
 * @param start
 * @param end
 * @returns
 */
function createTranslationTextElement(
    translation: string,
    start: number,
    end: number,
): ITranslationElement {
    const text = translation.substring(start, end + 1);

    return {
        element: activeDocument.createTextNode(text),
        start: start,
        end: end,
    };
}
