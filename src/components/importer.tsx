import { resourceDir } from '@tauri-apps/api/path';

const directory = resourceDir();

export default await directory;