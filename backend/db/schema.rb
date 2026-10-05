# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_05_090000) do
  create_table "employees", force: :cascade do |t|
    t.string "employee_code", null: false
    t.string "full_name", null: false
    t.string "email", null: false
    t.string "job_title", null: false
    t.string "department", null: false
    t.string "country_code", limit: 2, null: false
    t.string "employment_type", default: "full_time", null: false
    t.integer "salary", null: false
    t.date "hire_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country_code", "department"], name: "index_employees_on_country_code_and_department"
    t.index ["country_code", "job_title"], name: "index_employees_on_country_code_and_job_title"
    t.index ["email"], name: "index_employees_on_email", unique: true
    t.index ["employee_code"], name: "index_employees_on_employee_code", unique: true
    t.index ["full_name"], name: "index_employees_on_full_name"
    t.index ["salary"], name: "index_employees_on_salary"
    t.check_constraint "salary > 0", name: "employees_salary_positive"
  end
end
