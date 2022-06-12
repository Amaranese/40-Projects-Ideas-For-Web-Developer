class zulip_ops::profile::zmirror {
  include zulip_ops::profile::base
  include zulip::supervisor

  $zmirror_packages = [# Packages needed to run the mirror
    'libzephyr4-krb5',
    'zephyr-clients',
    'krb5-config',
    'krb5-user',
    # Packages needed to build pyzephyr
    'libzephyr-dev',
    'comerr-dev',
    'python3-dev',
    'python2.7-dev',
    'cython3',
    'cython',
  ]
  package { $zmirror_packages:
    ensure  => installed,
  }

  file { "${zulip::common::supervisor_conf_dir}/zmirror.conf":
    ensure  => file,
    require => Package[supervisor],
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    source  => 'puppet:///modules/zulip_ops/supervisor/conf.d/zmirror.conf',
    notify  => Service['supervisor'],
  }

  file { '/etc/cron.d/zephyr-mirror':
    ensure => file,
    owner  => 'root',
    group  => 'root',
    mode   => '0644',
    source => 'puppet:///modules/zulip_ops/cron.d/zephyr-mirror',
  }

  file { '/etc/krb5.conf':
    ensure => file,
    owner  => 'root',
    group  => 'root',
    mode   => '0644',
    source => 'puppet:///modules/zulip_ops/krb5.conf',
  }

  file { '/etc/default/zephyr-clients':
    ensure => file,
    owner  => 'root',
    group  => 'root',
    mode   => '0644',
    source => 'puppet:///modules/zulip_ops/zephyr-clients',
  }

  file { '/usr/lib/nagios/plugins/zulip_zephyr_mirror':
    require => Package[$zulip::common::nagios_plugins],
    recurse => true,
    purge   => true,
    owner   => 'root',
    group   => 'root',
    mode    => '0755',
    source  => 'puppet:///modules/zulip_ops/nagios_plugins/zulip_zephyr_mirror',
  }

  # Allow the relevant UDP ports
  concat::fragment { 'iptables-zmirror.v4':
    target => '/etc/iptables/rules.v4',
    source => 'puppet:///modules/zulip_ops/iptables/zmirror.v4',
    order  => '20',
  }
  concat::fragment { 'iptables-zmirror.v6':
    target => '/etc/iptables/rules.v6',
    source => 'puppet:///modules/zulip_ops/iptables/zmirror.v6',
    order  => '20',
  }

  # TODO: Do the rest of our setup, which includes at least:
  # Building python-zephyr after cloning it from https://github.com/ebroder/python-zephyr
  # Putting tabbott/extra's keytab on the system at /home/zulip/tabbott.extra.keytab
}
