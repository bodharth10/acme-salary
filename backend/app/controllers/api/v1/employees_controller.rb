module Api
  module V1
    class EmployeesController < BaseController
      before_action :require_employee_management!, only: %i[create update destroy]

      PERMITTED = %i[full_name email job_title department country_code employment_type salary hire_date].freeze

      def index
        result = EmployeeQuery.new(params.permit(:q, :country, :department, :job_title, :sort, :direction, :page, :per_page)).call
        render json: {
          data: result.records.map { |e| EmployeeSerializer.render(e) },
          meta: { total: result.total, page: result.page, per_page: result.per_page, total_pages: result.total_pages }
        }
      end

      def show
        employee = Employee.find(params[:id])
        render json: EmployeeSerializer.render(employee, peer_comparison: PayInsights.new.peer_comparison(employee))
      end

      def create
        employee = Employee.new(employee_params)
        if employee.save
          render json: EmployeeSerializer.render(employee), status: :created
        else
          render_validation_errors(employee)
        end
      end

      def update
        employee = Employee.find(params[:id])
        if employee.update(employee_params)
          render json: EmployeeSerializer.render(employee)
        else
          render_validation_errors(employee)
        end
      end

      def destroy
        Employee.find(params[:id]).destroy!
        head :no_content
      end

      private

      def employee_params
        params.require(:employee).permit(*PERMITTED)
      end
    end
  end
end
