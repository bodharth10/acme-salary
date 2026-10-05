class UserSerializer
  def self.render(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      # The UI hides controls based on this; the server still enforces it.
      permissions: { manage_employees: user.can_manage_employees? }
    }
  end
end
