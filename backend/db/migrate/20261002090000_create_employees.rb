class CreateEmployees < ActiveRecord::Migration[7.2]
  def change
    create_table :employees do |t|
      t.string  :employee_code,   null: false
      t.string  :full_name,       null: false
      t.string  :email,           null: false
      t.string  :job_title,       null: false
      t.string  :department,      null: false
      t.string  :country_code,    null: false, limit: 2
      t.string  :employment_type, null: false, default: "full_time"
      # Annual gross salary in whole units of the country's currency.
      # Currency is derived from country_code, never stored separately.
      t.integer :salary,          null: false
      t.date    :hire_date,       null: false

      t.timestamps
    end

    add_index :employees, :employee_code, unique: true
    add_index :employees, :email, unique: true
    add_index :employees, :full_name
    add_index :employees, [ :country_code, :job_title ]
    add_index :employees, [ :country_code, :department ]
    add_index :employees, :salary
  end
end
