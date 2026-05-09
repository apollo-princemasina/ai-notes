/**
 * AI Notes App - CLEAN WORKING VERSION
 */

// ===============================
// SUPABASE SETUP
// ===============================

const supabaseUrl = "https://rfwzonatdtxvkloxsali.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3pvbmF0ZHR4dmtsb3hzYWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjEwMDgsImV4cCI6MjA5Mzg5NzAwOH0.aTiLSPjM1AqDaRMN4D7LTZeijqmVmcB_op7BJOI1eNM"; // 🔴 replace this from Supabase dashboard

const sb = supabase.createClient(supabaseUrl, supabaseKey);

// ===============================
// DATA LAYER
// ===============================

const DataService = {

    // GET NOTES
    async getNotes() {
        const { data, error } = await sb
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("GET ERROR:", error);
            return [];
        }

        return data;
    },

    // SAVE NOTE
    async saveNote(content) {
        console.log("Saving:", content);

        const { data, error } = await sb
            .from("notes")
            .insert([
                { content: content }
            ])
            .select();

        console.log("SAVE RESPONSE:", { data, error });

        if (error) {
            alert("Save error: " + error.message);
            console.error(error);
            return null;
        }

        return data;
    },

    // DELETE NOTE
    async deleteNote(id) {
        const { error } = await sb
            .from("notes")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("DELETE ERROR:", error);
            return false;
        }

        return true;
    }
};

// ===============================
// UI LAYER
// ===============================

const UI = {
    noteInput: document.getElementById("noteInput"),
    saveBtn: document.getElementById("saveBtn"),
    notesList: document.getElementById("notesList"),
    emptyState: document.getElementById("emptyState"),
    charCount: document.getElementById("charCount"),

    init() {
        this.loadNotes();
        this.events();
    },

    events() {
        this.saveBtn.addEventListener("click", () => this.handleSave());

        this.noteInput.addEventListener("input", () => {
            this.charCount.textContent = `${this.noteInput.value.length} characters`;
        });

        this.noteInput.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                this.handleSave();
            }
        });
    },

    async loadNotes() {
        const notes = await DataService.getNotes();
        this.render(notes);
    },

    async handleSave() {
        const content = this.noteInput.value.trim();
        if (!content) return;

        this.saveBtn.disabled = true;
        this.saveBtn.textContent = "Saving...";

        try {
            const result = await DataService.saveNote(content);

            if (result) {
                this.noteInput.value = "";
                this.charCount.textContent = "0 characters";
                await this.loadNotes();
            }

        } catch (err) {
            console.error("UI ERROR:", err);
        } finally {
            this.saveBtn.disabled = false;
            this.saveBtn.textContent = "Save Note";
        }
    },

    async handleDelete(id) {
        if (!confirm("Delete this note?")) return;

        await DataService.deleteNote(id);
        await this.loadNotes();
    },

    render(notes) {
        if (!notes || notes.length === 0) {
            this.emptyState.style.display = "block";
            this.notesList.innerHTML = "";
            return;
        }

        this.emptyState.style.display = "none";

        this.notesList.innerHTML = notes.map(note => `
            <div class="note-card">
                <div class="note-content">${this.escapeHTML(note.content)}</div>

                <div class="note-footer">
                    <span class="note-timestamp">
                        ${new Date(note.created_at).toLocaleString()}
                    </span>

                    <button class="btn btn-delete" onclick="UI.handleDelete('${note.id}')">
                        🗑
                    </button>
                </div>
            </div>
        `).join("");
    },

    escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
};

// ===============================
// INIT APP
// ===============================

document.addEventListener("DOMContentLoaded", () => UI.init());