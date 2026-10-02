require "rails_helper"

RSpec.describe Employee do
  it "is valid with the factory defaults" do
    expect(build(:employee)).to be_valid
  end

  it "derives currency from the country" do
    expect(build(:employee, country_code: "IN").currency).to eq("INR")
    expect(build(:employee, country_code: "DE").currency).to eq("EUR")
  end

  it "generates an employee code on create" do
    expect(create(:employee).employee_code).to match(/\AEMP-[A-Z0-9]{8}\z/)
  end

  it "normalizes email, name and country code" do
    employee = build(:employee, email: "  Jane.Doe@ACME.example ", full_name: " Jane   Doe ", country_code: "gb")
    expect(employee.email).to eq("jane.doe@acme.example")
    expect(employee.full_name).to eq("Jane Doe")
    expect(employee.country_code).to eq("GB")
  end

  describe "validations" do
    it "requires a unique email, case-insensitively" do
      create(:employee, email: "dup@acme.example")
      duplicate = build(:employee, email: "DUP@acme.example")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end

    it "rejects countries ACME does not operate in" do
      employee = build(:employee, country_code: "XX")
      expect(employee).not_to be_valid
      expect(employee.errors[:country_code]).to include("is not a country ACME operates in")
    end

    it "rejects non-positive and fractional salaries" do
      expect(build(:employee, salary: 0)).not_to be_valid
      expect(build(:employee, salary: -5)).not_to be_valid
      expect(build(:employee, salary: 100.5)).not_to be_valid
    end

    it "rejects unknown departments and employment types" do
      expect(build(:employee, department: "Space Program")).not_to be_valid
      expect(build(:employee, employment_type: "volunteer")).not_to be_valid
    end

    it "rejects a hire date in the future" do
      employee = build(:employee, hire_date: Date.current + 1)
      expect(employee).not_to be_valid
      expect(employee.errors[:hire_date]).to include("can't be in the future")
    end
  end

  describe ".search" do
    it "matches name, email or employee code case-insensitively" do
      jane = create(:employee, full_name: "Jane Doe", email: "jane@acme.example")
      create(:employee, full_name: "John Roe", email: "john@acme.example")

      expect(described_class.search("jane")).to contain_exactly(jane)
      expect(described_class.search("JANE@ACME")).to contain_exactly(jane)
      expect(described_class.search(jane.employee_code.downcase)).to contain_exactly(jane)
    end

    it "treats LIKE wildcards in the term literally" do
      create(:employee, full_name: "Jane Doe")
      expect(described_class.search("%")).to be_empty
    end
  end
end
