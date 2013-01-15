require 'rubygems'
require 'sinatra/base'
require 'sinatra/jsonp'
require 'natural_time'
require 'socket'
require 'mime/types'
require 'iconv'
require 'fileutils'

module Sinatra
  module HisaishiAdmin
    
    module Helpers
      def collection_genres
        [
          "Pop", "Rock", "Folk", "Classical", 
          "Dance", "R&B", "Hip-Hop", "Metal", 
          "Choral", "Standard", "Rave", "Denpa", 
          "Enka", "Other",
        ]
      end
      
      def collection_languages
        {
          "JP" => "Japanese",
          "EN" => "English",
          "ZH" => "Chinese",
          "KR" => "Korean",
          "FR" => "French",
          "DE" => "German",
          "RU" => "Russian",
          "UNK" => "Unknown"
        }
      end
      
      def collection_media
        [
          "N/A", "TV", "Movie", "Game", "Other",
        ]
      end
      
      def has_file(index, params)
        result = {
          :valid => false,
          :tmpfile => nil,
          :name => nil
        }
        test = (
          params[index] && (
            result[:tmpfile] = params[index][:tempfile]
          ) && (
            result[:name] = params[index][:filename]
          )
        )
        result[:valid] = !test.nil? && (test == params[index][:filename])
        return result
      end
      
      def setup_dir(dir)
        if (!File.exist?(dir))
          #Dir.mkdir(dir, 0775)
          FileUtils.mkpath dir, {:mode => 0775}
        end
      end
      
      def write_file(base_path, uploads_path, result)
        uploads_dir = File.join(base_path, uploads_path)
        setup_dir(uploads_dir)
        
        final_filename = nil
        if (result[:valid])
          final_filename = File.join(uploads_dir, result[:name])
          FileUtils.cp(result[:tmpfile].path, final_filename)
          final_filename = final_filename.sub(base_path, "/")
        end
        final_filename
      end
      
      def process_file_picker_file(value, destination, path_prefix = nil)
        # No file
        if value.to_s == ''
          ''
        end
        
        # Test to see if we should leave file in place
        if value.include? destination
          value
        end
        
        # Set up new location with unique name
        new_basename = sanitize_filename(File.basename(value))
        new_destination = File.join(destination, new_basename)
        while (File.exist?(new_destination))
          rand_str = (0...8).map{65.+(rand(26)).chr}.join
          new_destination = File.join(destination, rand_str + new_basename)
        end
        
        # Move file into place
        FileUtils.cp(value, new_destination)
        
        # Remove path prefix if needed
        if path_prefix != nil
          new_destination = new_destination.sub(path_prefix, '')
        end
        
        # Finally...
        new_destination
      end
      
      def sanitize_filename(filename)
        returning filename.strip do |name|
         name.gsub!(/^.*(\\|\/)/, '')
         name.gsub!(/[^0-9A-Za-z.\-]/, '_')
        end
      end
      
      def save_song(params, song_id = 0)
        song = Song.new
        unless song_id == 0
          song = Song.get(song_id.to_i)
        end
        
        # Minimum validity: uploaded audio file, video file or video URL
        media_valid = params[:audio_file] || params[:video_file] || params[:video_url]
        unless media_valid
          nil
        end
        
        # Generate dir name
        ic_ignore = Iconv.new('US-ASCII//IGNORE//TRANSLIT', 'UTF-8')
        if song.source_dir.to_s == ''
          dir_parts = []
          if params[:origin_title].to_s != ''
            dir_parts << sanitize_filename(params[:origin_title])
          end
          if params[:artist].to_s != ''
            dir_parts << sanitize_filename(params[:artist])
          end
          if params[:title].to_s != ''
            dir_parts << sanitize_filename(params[:title])
          end
          song.source_dir = dir_parts.join('/')
        end
        
        pub_base = "public/music/"
        
        files_dir = File.join(Dir.pwd, pub_base + song.source_dir)
        setup_dir(files_dir)
        
        compiled_short_song_dir = pub_base + song.source_dir
        
        # Audio file
        unless params[:audio_file].to_s == ''
          song.audio_file = process_file_picker_file(
            "public/" + params[:audio_file], 
            compiled_short_song_dir,
            compiled_short_song_dir
          )
        end
        
        # Lyrics file
        unless params[:lyrics_file].to_s == ''
          song.lyrics_file = process_file_picker_file(
            "public/" + params[:lyrics_file], 
            compiled_short_song_dir,
            compiled_short_song_dir
          )
        end
        
        # Use Video File
        unless params[:video_file].to_s == ''
          song.video_file = process_file_picker_file(
            "public/" + params[:video_file], 
            compiled_short_song_dir,
            compiled_short_song_dir
          )
          song.video_fmt = MIME::Types.type_for(File.join(compiled_short_song_dir, song.video_file))
        end
        
        # Use Video URL
        unless params[:video_url].to_s == ''
          song.video_file = params[:video_url]
          song.video_fmt = MIME::Types.type_for(File.join(compiled_short_song_dir, song.video_file))
          if song.video_file.include? 'youtube'
            song.video_fmt = 'video/youtube'
          end
          # @TODO: other video APIs?
        end
        
        # Use image file
        unless params[:image_file].to_s == ''
          song.image_file = process_file_picker_file(
            "public/" + params[:image_file], 
            compiled_short_song_dir,
            compiled_short_song_dir
          )
        end
        
        song.title = params[:title]
        song.artist = params[:artist]
        song.album = params[:album]
        song.origin_title = params[:origin_title]
        song.origin_type = params[:origin_type]
        song.origin_medium = params[:origin_medium]
        song.genre = params[:genre]
        song.language = params[:language]
        song.karaoke = params[:karaoke]
        
        song.save
        
        song
      end
      
      def read_file(filename)
        puts filename
        File.read(filename) if File.exists?(filename)
        rescue
          nil
      end
    end
    
    def self.registered(app)
      app.helpers HisaishiAdmin::Helpers

      app.get '/admin' do
        pin_auth
        "Dashboard!"
      end
      
      app.get '/admin/list' do
        pin_auth
        songs = Song.all
        haml :admin_list, :locals => {:songs => songs}
      end
      
      app.get '/admin/add' do
        pin_auth
        haml :admin_add, :locals => {
          :languages => collection_languages, 
          :genres => collection_genres, 
          :media => collection_media, 
          :success => params["success"].to_s != '' ? params["success"] : nil,
        }
      end
      
      app.post '/admin/add' do
        pin_auth!
        song = save_song(params)
        unless song.nil?
          redirect '/admin/edit/' + song.id.to_s + '?success=true'
        end
        redirect '/admin/add?success=false' # @TODO: sub invalid values in
      end
      
      app.get '/admin/edit/:song_id' do
        pin_auth
        haml :admin_add, :locals => {
          :languages => collection_languages, 
          :genres => collection_genres, 
          :media => collection_media, 
          :song => Song.get(params[:song_id].to_i),
          :success => params["success"].to_s != '' ? params["success"] : nil,
        }
      end
      
      app.post '/admin/edit/:song_id' do
        pin_auth!
        song = save_song(params, params[:song_id])
        unless song.nil?
          redirect '/admin/edit/' + song.id.to_s + '?success=true'
        end
        redirect '/admin/edit/' + song.id.to_s + '?success=false'
      end
      
      app.get '/admin/lyrics/:song_id' do
        pin_auth
        song = Song.get(params[:song_id].to_i)
        lyrics = ''
        path = song.local_lyrics_path
        
        wd = Dir.pwd
        
        unless path.nil?
          path = File.join(File.dirname(__FILE__), path)
          lyrics = read_file(path)
        end
        
        Dir.chdir(wd)
        
        haml :admin_lyrics, :locals => {
          :song => song,
          :lyrics => lyrics,
          :success => params["success"].to_s != '' ? params["success"] : nil,
        }
      end
      
      app.post '/admin/lyrics/:song_id' do
        pin_auth!
        "Update a song's lyrics!"
      end
      
      app.get '/admin/delete/:song_id' do
        pin_auth
        pin_auth
        haml :admin_delete, :locals => {
          :song => Song.get(params[:song_id].to_i),
        }
      end
      
      app.post '/admin/delete/:song_id' do
        pin_auth!
        ok = params[:delete_ok]
        if ok == '1'
          # Delete song
          song = Song.get(params[:song_id].to_i)
          song.delete
        end
        redirect '/admin/list'
      end
      
      app.get '/admin/helper/:field' do
        pin_auth!
        
        field = params[:field]
        term = params[:term]
        
        results = []
        songs = Song.search_by_field field, term
        unless songs.nil?
          songs.each do |s|
            results << s.send(field)
          end
        end
        
        JSONP results.sort.uniq
      end
      
      app.post '/admin/upload' do
        result = {
          :ok => false,
          :filepath => nil
        }
        upload = has_file(:file_source, params)
  
        unless (upload[:valid])
          JSONP result
        end
  
        dirname = (upload[:name].split('.')[0] + (0...8).map{65.+(rand(25)).chr}.join).gsub(/[\x00\/\\:\*\?\"<>\|]/, '_')
  
        pub_base = "public/"
        pub_dir = File.join(Dir.pwd, pub_base)
        uploads_path = "uploads"
  
        result[:filepath] = write_file(pub_dir, uploads_path, upload)
        unless result[:filepath].nil?
          result[:ok] = true
        end
        
        JSONP result
      end
    end
  end
  
  register HisaishiAdmin
end