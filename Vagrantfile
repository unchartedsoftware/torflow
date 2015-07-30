VAGRANTFILE_API_VERSION = "2"

$script = <<SCRIPT
sudo yum -y update
sudo yum -y install epel-release docker
sudo yum -y install nodejs npm
sudo npm install -g gulp
sudo yum -y install java-1.8.0-openjdk-devel.x86_64

echo export DOCKER_HOST=tcp://172.17.42.1:2375 >> .bashrc
SCRIPT

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "~/centos7.box"

  # run a bash script on startup  
  config.vm.provision :shell, :inline => $script

  # 4GB of RAM for the VM
  config.vm.provider "virtualbox" do |vb|
    # Use VBoxManage to customize the VM. For example to change memory:
    vb.customize ["modifyvm", :id, "--memory", "4096"]
  end

  config.vm.network "forwarded_port", guest: 3000, host: 3000
end
