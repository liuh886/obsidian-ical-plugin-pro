import { TFolder, AbstractInputSuggest, App } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    content: TFolder[];
    private readonly textInput: HTMLInputElement;

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.textInput = textInputEl;
    }

    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: any) => {
            if (folder instanceof TFolder && folder.path.toLowerCase().includes(lowerCaseInputStr)) {
                folders.push(folder);
            }
        });

        return folders;
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder): void {
        this.textInput.value = folder.path;
        this.textInput.trigger("input");
        this.close();
    }
}
