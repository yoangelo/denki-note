import type { defineConfig as DefineConfig } from 'orval';

const defineConfig: typeof DefineConfig = (config) => config;

export default defineConfig({
  timesheet: {
    input: './dist/bundled.yaml', // ← Redoclyでバンドル後を読む
    output: {
      mode: 'tags-split',                      // ファイル分割生成
      target: '../front/src/api/generated',  // 出力ディレクトリ（指定どおり）
      client: 'react-query',              // React Queryフックを生成
      mock: false,
      baseUrl: '',                        // baseURLはmutator側で付与
      prettier: true,
      clean: true,
      override: {
        mutator: {
          path: '../front/src/api/mutator.ts',
          name: 'httpClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
        // 必要に応じて型名やhook名のプリフィックスなども設定可
      },
    },
  },
});
