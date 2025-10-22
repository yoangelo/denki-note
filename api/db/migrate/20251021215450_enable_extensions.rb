class EnableExtensions < ActiveRecord::Migration[7.1]
  def change
    enable_extension "pgcrypto"  # UUID生成用
    enable_extension "pg_trgm"   # インクリメンタル検索用
  end
end
