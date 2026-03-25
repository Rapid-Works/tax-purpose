import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'word-upload',
  name: 'Word Upload',
  icon: 'upload_file',
  description: 'Upload Word documents and convert to rich text',
  component: InterfaceComponent,
  options: null,
  types: ['json', 'text'],
});
