module Api
  module V1
    # Reference data the UI needs for filters and form dropdowns.
    class MetaController < BaseController
      def show
        render json: {
          countries: Country.all.map(&:to_h),
          departments: OrgCatalog::DEPARTMENTS,
          job_titles: (OrgCatalog::JOB_TITLES + Employee.distinct.pluck(:job_title)).uniq.sort,
          employment_types: OrgCatalog::EMPLOYMENT_TYPES
        }
      end
    end
  end
end
