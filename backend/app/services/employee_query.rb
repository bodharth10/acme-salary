# Turns the employee list's query params into a filtered, sorted, paginated
# relation. All user input is whitelisted here so the controller stays thin.
class EmployeeQuery
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  Result = Data.define(:records, :total, :page, :per_page) do
    def total_pages = (total.to_f / per_page).ceil
  end

  def initialize(params = {})
    @params = params.to_h.symbolize_keys
  end

  def call
    scope = filtered
    total = scope.count
    records = scope.order(order_clause).limit(per_page).offset((page - 1) * per_page)
    Result.new(records: records.to_a, total: total, page: page, per_page: per_page)
  end

  private

  attr_reader :params

  def filtered
    scope = Employee.all
    scope = scope.search(params[:q]) if params[:q].present?
    scope = scope.in_country(params[:country]) if params[:country].present?
    scope = scope.where(department: params[:department]) if params[:department].present?
    scope = scope.where(job_title: params[:job_title]) if params[:job_title].present?
    scope
  end

  def order_clause
    column = Employee::SORTABLE_COLUMNS.include?(params[:sort]) ? params[:sort] : "full_name"
    direction = params[:direction] == "desc" ? :desc : :asc
    # Tie-break on id so pagination is stable when sort values repeat.
    { column => direction, id: :asc }
  end

  def page
    [ params[:page].to_i, 1 ].max
  end

  def per_page
    requested = params[:per_page].to_i
    requested.positive? ? [ requested, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE
  end
end
