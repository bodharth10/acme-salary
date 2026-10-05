class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name,            null: false
      t.string :email,           null: false
      t.string :password_digest, null: false
      # hr_manager: read and write. viewer: read only.
      t.string :role,            null: false, default: "viewer"

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_check_constraint :users, "role IN ('hr_manager', 'viewer')", name: "users_role_known"
  end
end
