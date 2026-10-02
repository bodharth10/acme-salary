# Countries ACME operates in. A small, rarely-changing reference list, so it
# lives in code rather than a table: it is versioned, reviewed, and lets the
# currency be derived from the country instead of being typed in by hand.
class Country < Data.define(:code, :name, :currency)
  ALL = [
    new(code: "US", name: "United States",  currency: "USD"),
    new(code: "GB", name: "United Kingdom", currency: "GBP"),
    new(code: "DE", name: "Germany",        currency: "EUR"),
    new(code: "FR", name: "France",         currency: "EUR"),
    new(code: "IN", name: "India",          currency: "INR"),
    new(code: "CA", name: "Canada",         currency: "CAD"),
    new(code: "AU", name: "Australia",      currency: "AUD"),
    new(code: "SG", name: "Singapore",      currency: "SGD"),
    new(code: "BR", name: "Brazil",         currency: "BRL"),
    new(code: "JP", name: "Japan",          currency: "JPY")
  ].freeze

  BY_CODE = ALL.index_by(&:code).freeze

  def self.all = ALL
  def self.codes = BY_CODE.keys
  def self.find(code) = BY_CODE.fetch(code.to_s.upcase) { raise ActiveRecord::RecordNotFound, "Unknown country #{code}" }
  def self.find_by(code) = BY_CODE[code.to_s.upcase]
end
