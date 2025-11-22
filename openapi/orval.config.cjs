// openapi/orval.config.cjs
/** @type {import('orval').Config} */
const config = {
  denkiNote: {
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
};

module.exports = config;
