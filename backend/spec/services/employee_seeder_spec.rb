require "rails_helper"

RSpec.describe EmployeeSeeder do
  it "creates the requested number of employees" do
    expect { described_class.new(count: 150).call }.to change(Employee, :count).from(0).to(150)
  end

  it "is deterministic for a given seed" do
    described_class.new(count: 50, seed: 7).call
    first_run = Employee.order(:employee_code).pluck(:full_name, :salary, :country_code)
    described_class.new(count: 50, seed: 7).call
    expect(Employee.order(:employee_code).pluck(:full_name, :salary, :country_code)).to eq(first_run)
  end

  it "produces rows that pass model validations (insert_all skips them)" do
    described_class.new(count: 200).call
    invalid = Employee.all.reject(&:valid?)
    expect(invalid).to be_empty, invalid.first&.errors&.full_messages&.to_sentence
  end

  it "only uses titles that belong to the employee's department" do
    described_class.new(count: 200).call
    Employee.find_each do |e|
      expect(OrgCatalog::TITLES_BY_DEPARTMENT.fetch(e.department)).to include(e.job_title)
    end
  end

  it "replaces existing data rather than appending" do
    described_class.new(count: 20).call
    described_class.new(count: 30).call
    expect(Employee.count).to eq(30)
  end
end
