<template>
  <div class="word-upload-interface">
    <!-- Upload Button -->
    <div
      class="upload-area"
      :class="{ dragover: isDragover }"
      @click="triggerFileInput"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <v-icon name="upload_file" />
      <span>Word-Datei hochladen (.docx)</span>
      <input
        ref="fileInput"
        type="file"
        accept=".docx"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Status -->
    <div v-if="status" class="status" :class="statusType">
      {{ status }}
    </div>

    <!-- Preview of current content -->
    <div v-if="value && value.type === 'doc'" class="content-preview">
      <div class="preview-header">
        <span>Inhalt geladen ({{ nodeCount }} Elemente)</span>
        <button class="clear-btn" @click="clearContent">Löschen</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import mammoth from 'mammoth';

export default {
  props: {
    value: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const isDragover = ref(false);
    const status = ref('');
    const statusType = ref('');

    const nodeCount = computed(() => {
      return props.value?.content?.length || 0;
    });

    function triggerFileInput() {
      fileInput.value?.click();
    }

    function handleDrop(e) {
      isDragover.value = false;
      const file = e.dataTransfer?.files[0];
      if (file) processFile(file);
    }

    function handleFileSelect(e) {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    }

    async function processFile(file) {
      if (!file.name.endsWith('.docx')) {
        status.value = 'Bitte eine .docx Datei auswählen';
        statusType.value = 'error';
        return;
      }

      status.value = 'Wird konvertiert...';
      statusType.value = 'info';

      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        let html = result.value;
        // Remove first h1 (usually title)
        html = html.replace(/<h1>.*?<\/h1>/, '');

        // Convert HTML to Tiptap JSON
        const json = htmlToTiptapJson(html);

        emit('input', json);

        status.value = 'Erfolgreich konvertiert!';
        statusType.value = 'success';

        // Clear status after 3 seconds
        setTimeout(() => {
          status.value = '';
        }, 3000);
      } catch (err) {
        status.value = 'Fehler: ' + err.message;
        statusType.value = 'error';
      }
    }

    function htmlToTiptapJson(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = [];

      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text.trim()) {
            return { type: 'text', text };
          }
          return null;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();

          if (tag === 'h1') return { type: 'heading', attrs: { level: 1 }, content: processChildren(node) };
          if (tag === 'h2') return { type: 'heading', attrs: { level: 2 }, content: processChildren(node) };
          if (tag === 'h3') return { type: 'heading', attrs: { level: 3 }, content: processChildren(node) };
          if (tag === 'h4') return { type: 'heading', attrs: { level: 4 }, content: processChildren(node) };
          if (tag === 'p') {
            const children = processChildren(node);
            if (children.length === 0) return null;
            return { type: 'paragraph', content: children };
          }
          if (tag === 'ul') return { type: 'bulletList', content: processChildren(node) };
          if (tag === 'ol') return { type: 'orderedList', content: processChildren(node) };
          if (tag === 'li') return { type: 'listItem', content: [{ type: 'paragraph', content: processChildren(node) }] };
          if (tag === 'strong' || tag === 'b') {
            const children = processChildren(node);
            return children.map(c => c.type === 'text' ? { ...c, marks: [{ type: 'bold' }] } : c);
          }
          if (tag === 'em' || tag === 'i') {
            const children = processChildren(node);
            return children.map(c => c.type === 'text' ? { ...c, marks: [{ type: 'italic' }] } : c);
          }
          if (tag === 'blockquote') return { type: 'blockquote', content: processChildren(node) };
          if (tag === 'hr') return { type: 'horizontalRule' };
          if (tag === 'br') return { type: 'hardBreak' };

          return processChildren(node);
        }
        return null;
      }

      function processChildren(node) {
        const results = [];
        for (const child of node.childNodes) {
          const result = processNode(child);
          if (result) {
            if (Array.isArray(result)) {
              results.push(...result);
            } else {
              results.push(result);
            }
          }
        }
        return results;
      }

      for (const child of doc.body.childNodes) {
        const result = processNode(child);
        if (result) {
          if (Array.isArray(result)) {
            content.push(...result);
          } else {
            content.push(result);
          }
        }
      }

      return { type: 'doc', content };
    }

    function clearContent() {
      emit('input', null);
    }

    return {
      fileInput,
      isDragover,
      status,
      statusType,
      nodeCount,
      triggerFileInput,
      handleDrop,
      handleFileSelect,
      clearContent,
    };
  },
};
</script>

<style scoped>
.word-upload-interface {
  width: 100%;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px dashed var(--border-normal);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--background-subdued);
}

.upload-area:hover,
.upload-area.dragover {
  border-color: var(--primary);
  background: var(--primary-alt);
}

.status {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  font-size: 14px;
}

.status.info {
  background: var(--blue-alt);
  color: var(--blue);
}

.status.success {
  background: var(--success-alt);
  color: var(--success);
}

.status.error {
  background: var(--danger-alt);
  color: var(--danger);
}

.content-preview {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--background-subdued);
  border-radius: var(--border-radius);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  text-decoration: underline;
}
</style>
