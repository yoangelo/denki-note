class CreateManufacturers < ActiveRecord::Migration[7.1]
  def change
    create_table :manufacturers, id: :uuid, default: -> { "gen_random_uuid()" }, comment: "メーカー" do |t|
      t.string :name, null: false, comment: "メーカー名"
      t.datetime :discarded_at, comment: "削除日時（論理削除）"

      t.timestamps
    end

    add_index :manufacturers, :name, unique: true
    add_index :manufacturers, :discarded_at
  end
end
