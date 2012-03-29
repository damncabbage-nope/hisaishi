require 'mp3info'
require 'open-uri'

class Song
  include DataMapper::Resource
  property :id,      Serial
  property :title,     Text
  property :artist,     Text
  property :album,     Text
  property :origin_title,    Text
  property :origin_type,    Text
  property :origin_medium,    Text
  property :genre,    Text
  property :language, Text
  property :karaoke,  Enum[ :true, :false, :unknown ], :default => :unknown
  property :source_dir,   Text
  property :audio_file,   Text
  property :lyrics_file,   Text
  property :image_file,   Text
  property :yes,      Integer,   :default => 0
  property :no,      Integer,   :default => 0
  property :unknown,      Integer,   :default => 0  
  
  def path_base
    return settings.files + source_dir
  end
  
  def path
    return self.path_base + audio_file
  end
  
  def json
    song_data = []
    song_data << {
      :id    => id,
      :title   => title,
      :artist  => artist,
      :album   => album,
      :origin_title  => origin_title,
      :origin_medium   => origin_medium,
      :origin_type => origin_type,
      :genre => genre,
      :language => language,
      :karaoke => karaoke,
      :folder  => self.path_base,
      :audio   => audio_file,
      :lyrics  => lyrics_file,
      :cover   => image_file
    }
    return song_data.to_json
  end
  
  def vote(vote, reasons, session)
    if vote == 'yes'
      self.yes = self.yes + 1
    elsif vote == 'no'
      self.no = self.no + 1
    elsif vote == 'unknown'
      self.unknown = self.unknown + 1
    end
    
    self.save!
    
    vote = Vote.create(
      :user => session[:username],
      :song_id => self.id,
      :vote => vote
    )
    
    if vote == 'no'
      reasons.each do |idx, reason|
        vote.reasons.create(
          :type => reason['type'],
          :comment => reason['comment']
        )
      end
    end
  end
  
  def enqueue(requester)
    data = self.get_data!
    time = data.length.ceil
    
    new_queue = Queue.create(
      :requester => requester,
      :song_id => self.id,
      :time => time
    )
    
    return new_queue
  end
  
  def get_data!
    Mp3Info.open(self.path) do |mp3info|
      data = mp3info
    end
    return data
  end
end
