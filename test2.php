<?php
error_reporting(-1);
include('client/NodeLog.php');
NodeLog::init('127.0.0.1');

class Dummy
{
    static function err()
    {
        throw new Exception("aqa");
    }
}
Dummy1::err();

//$a = $va2r[2];
