# In production the React build is copied into public/. Any non-API GET that
# isn't a real file gets index.html so client-side routes survive a refresh.
class SpaController < ApplicationController
  def index
    index_file = Rails.public_path.join("index.html")
    if index_file.exist?
      send_file index_file, type: "text/html", disposition: "inline"
    else
      head :not_found
    end
  end
end
