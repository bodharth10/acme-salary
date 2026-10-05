require "rails_helper"

RSpec.describe User do
  it "is valid with the factory defaults" do
    expect(build(:user)).to be_valid
  end

  it "stores a bcrypt digest, never the password" do
    user = create(:user, password: "a-long-enough-password")
    expect(user.password_digest).to start_with("$2a$")
    expect(user.password_digest).not_to include("a-long-enough-password")
  end

  it "requires passwords of at least 12 characters" do
    user = build(:user, password: "short")
    expect(user).not_to be_valid
    expect(user.errors[:password]).to include("is too short (minimum is 12 characters)")
  end

  it "normalizes email and enforces uniqueness" do
    create(:user, email: "hr@acme.example")
    expect(build(:user, email: " HR@acme.example ")).not_to be_valid
  end

  it "rejects unknown roles" do
    expect(build(:user, role: "superuser")).not_to be_valid
  end

  describe "#can_manage_employees?" do
    it "is true for HR managers and false for viewers" do
      expect(build(:user).can_manage_employees?).to be(true)
      expect(build(:user, :viewer).can_manage_employees?).to be(false)
    end
  end
end
