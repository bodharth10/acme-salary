# Defence in depth: the model validates salary > 0, but bulk writes
# (insert_all, SQL consoles, future imports) bypass model validations.
class AddSalaryCheckConstraint < ActiveRecord::Migration[7.2]
  def change
    add_check_constraint :employees, "salary > 0", name: "employees_salary_positive"
  end
end
